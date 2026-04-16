from flask import Flask, request, jsonify, send_file
from flask_cors import CORS # Importe no topo
from pymongo import MongoClient
from flask.json.provider import DefaultJSONProvider
from bson import ObjectId
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from fpdf import FPDF
import io
from bson.errors import InvalidId



class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

app = Flask(__name__)

CORS(app) # Ative o CORS logo abaixo do app
app.json = CustomJSONProvider(app)

load_dotenv()

# Ligação ao MongoDB
client = MongoClient(os.environ.get("MONGO_URI"))
db = client["doceria"]
usuarios = db["usuarios"]
produtos = db["produtos"]
pedidos = db["pedidos"]

# --- FUNÇÃO AUXILIAR DE PERMISSÃO ---
def verificar_permissao(user_id, tipos_permitidos):
    if not user_id: return None
    user = usuarios.find_one({"_id": ObjectId(user_id)})
    if user and user['tipo'] in tipos_permitidos:
        return user
    return None

# ================= USUÁRIOS (Sem alterações) ================= 
@app.route('/api/registro', methods=['POST'])
def register():
    data = request.json
    user = {
        "nome": data['nome'], "email": data['email'], "tel": data.get('tel', ''),
        "senha": data['senha'], "tipo": data.get('tipo', 'cliente'), "created_at": datetime.now()
    }
    usuarios.insert_one(user)
    return jsonify({"msg": "Usuário criado"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = usuarios.find_one({"email": data['email'], "senha": data['senha']})
    if user: return jsonify({"id": str(user['_id']), "tipo": user['tipo'], "nome": user['nome']})
    return jsonify({"error": "Login inválido"}), 401

# ================= PRODUTOS (ADMIN ONLY) =================
@app.route('/api/produtos', methods=['GET', 'POST'])
def produtos_handler():
    if request.method == 'POST':
        user_id = request.headers.get('user-id') or request.headers.get('user_id')
        if not verificar_permissao(user_id, ['admin']):
            return jsonify({"error": "Acesso negado. Apenas administradores."}), 403
        data = request.json
        produto = {
            "nome": data['nome'], "tipoProduto": data['tipoProduto'],
            "preco": float(data['preco']), "qtd": int(data['qtd']), "created_at": datetime.now()
        }
        produtos.insert_one(produto)
        return jsonify({"msg": "Produto criado"})

    lista = list(produtos.find())
    for p in lista: p['_id'] = str(p['_id'])
    return jsonify(lista)


@app.route('/api/produtos/<id>', methods=['PUT', 'DELETE'])
def produto_update_delete(id):
    # 1. Verificação de Permissão (Mantida conforme sua lógica)
    user_id = request.headers.get('user-id') or request.headers.get('user_id')
    if not verificar_permissao(user_id, ['admin']):
        return jsonify({"error": "Acesso negado."}), 403

    try:
        # --- LÓGICA PARA ATUALIZAÇÃO (PUT) ---
        if request.method == 'PUT':
            dados = request.json
            if not dados:
                return jsonify({"error": "Dados não fornecidos"}), 400

            # Forçamos a conversão e o tratamento de erros de tipagem aqui dentro
            # Usamos .get() com valores padrão para evitar quebras
            update_data = {
                "nome": str(dados.get('nome', '')),
                "tipoProduto": str(dados.get('tipoProduto', '')),
                "preco": float(str(dados.get('preco', 0)).replace(',', '.')),
                "qtd": int(dados.get('qtd', 0))
            }

            resultado = produtos.update_one(
                {"_id": ObjectId(id)}, 
                {"$set": update_data}
            )

            if resultado.matched_count == 0:
                return jsonify({"error": "Produto não encontrado"}), 404
                
            return jsonify({"msg": "Atualizado com sucesso", "tipo": "int/float garantido"}), 200

        # --- LÓGICA PARA REMOÇÃO (DELETE) ---
        elif request.method == 'DELETE':
            resultado = produtos.delete_one({"_id": ObjectId(id)})
            
            if resultado.deleted_count == 0:
                return jsonify({"error": "Produto não encontrado"}), 404
                
            return jsonify({"msg": "Removido com sucesso"}), 200

    except ValueError as ve:
        # Captura erros de conversão (ex: preço que não é número)
        return jsonify({"error": f"Erro de formato nos dados: {str(ve)}"}), 400
    except Exception as e:
        # Captura qualquer outro erro inesperado
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500

# ================= PEDIDOS (CLIENTE E ADMIN CRUD COMPLETO) ==============
@app.route('/api/pedido', methods=['POST', 'GET'])
def pedido_handler():
    user_id = request.headers.get('user-id') or request.headers.get('user_id')
    
    if not verificar_permissao(user_id, ['cliente', 'admin']):
        return jsonify({"error": "Não autorizado"}), 403

    if request.method == 'POST':
        try:
            data = request.json
            itens_pedido = data.get('itens', [])
            total = 0
            produtos_atualizados = []

            # 1. Validação e Cálculo (Apenas leitura)
            for item in itens_pedido:
                p_id = ObjectId(item['id_produto'])
                prod_db = produtos.find_one({"_id": p_id})
                
                if not prod_db:
                    return jsonify({"error": f"Produto não encontrado"}), 404
                
                if prod_db['qtd'] < item['qtd']:
                    return jsonify({"error": f"Estoque insuficiente: {prod_db['nome']}"}), 400

                total += prod_db['preco'] * item['qtd']
                produtos_atualizados.append({
                    "id": p_id, "nome": prod_db['nome'],
                    "preco": prod_db['preco'], "qtd": item['qtd']
                })

            # 2. Atualização Atômica (O "pulo do gato")
            # Usamos o filtro 'qtd': {'$gte': p['qtd']} para garantir que o estoque
            # ainda é suficiente no exato milissegundo da gravação.
            for p in produtos_atualizados:
                resultado = produtos.update_one(
                    {"_id": p['id'], "qtd": {"$gte": p['qtd']}}, 
                    {"$inc": {"qtd": -p['qtd']}}
                )
                
                if resultado.modified_count == 0:
                    # Se não modificou, significa que alguém comprou antes de você processar
                    return jsonify({"error": f"O produto {p['nome']} esgotou enquanto você finalizava!"}), 400

            # 3. Registro do Pedido
            pedido = {
                "usuario_id": ObjectId(user_id),
                "itens": produtos_atualizados,
                "total": total,
                "data": datetime.now()
            }
            pedidos.insert_one(pedido)
            
            return jsonify({
                "msg": "Pedido criado com sucesso!",
                "total": total
            }), 201

        except InvalidId:
            return jsonify({"error": "ID de produto ou usuário inválido"}), 400
        except Exception as e:
            return jsonify({"error": f"Erro interno: {str(e)}"}), 500

    # GET Pedidos (Mantendo sua lógica de listagem)
    lista = list(pedidos.find().sort("data", -1)) # Ordenado por data
    for p in lista:
        p['_id'] = str(p['_id'])
        p['usuario_id'] = str(p['usuario_id'])
    return jsonify(lista)



@app.route('/api/pedido/<id>', methods=['PUT', 'DELETE'])
def pedido_modificar(id):
    user_id = request.headers.get('user-id') or request.headers.get('user_id')
    user = verificar_permissao(user_id, ['cliente', 'admin'])
    if not user: return jsonify({"error": "Não autorizado"}), 403

    pedido = pedidos.find_one({"_id": ObjectId(id)})
    if not pedido: return jsonify({"error": "Pedido não encontrado"}), 404

    if request.method == 'DELETE':
        # Regra das 24h para clientes
        tempo_decorrido = datetime.now() - pedido['data']
        if user['tipo'] == 'cliente' and tempo_decorrido > timedelta(hours=24):
            return jsonify({"error": "Cancelamento negado. Já passaram mais de 24h."}), 400
        
        # Devolver stock se apagar
        for item in pedido['itens']:
            produtos.update_one({"_id": item['id']}, {"$inc": {"qtd": item['qtd']}})
            
        pedidos.delete_one({"_id": ObjectId(id)})
        return jsonify({"msg": "Pedido cancelado e stock reposto."})

    if request.method == 'PUT':
        pedidos.update_one({"_id": ObjectId(id)}, {"$set": request.json})
        return jsonify({"msg": "Pedido atualizado."})




#================= Relatorio meus pedidos ==================


@app.route('/api/relatorio/meus-pedidos', methods=['GET'])
def relatorio_usuario_logado():
    try:
        # 1. Identificação do Usuário via Header
        user_id = request.headers.get('user-id') or request.headers.get('user_id')
        user = verificar_permissao(user_id, ['cliente', 'admin'])
        
        if not user:
            return jsonify({"error": "Usuário não autenticado ou não encontrado"}), 401

        # 2. Busca apenas os pedidos DESTE usuário no MongoDB
        meus_vendas = list(pedidos.find({"usuario_id": ObjectId(user_id)}).sort("data", -1))

        if not meus_vendas:
            return jsonify({"error": "Você ainda não possui pedidos para gerar relatório."}), 404

        # 3. Configuração do PDF (Identidade Sabor e Arte)
        pdf = FPDF(orientation='P', unit='mm', format='A4')
        pdf.add_page()
        
        # Cabeçalho Estilizado
        pdf.set_font("Helvetica", 'B', 18)
        pdf.set_text_color(236, 72, 153) # Rosa padrão
        pdf.cell(190, 15, "SABOR E ARTE - DOCERIA", ln=True, align='C')
        
        pdf.set_font("Helvetica", 'B', 12)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(190, 10, f"EXTRATO DE COMPRAS: {user['nome'].upper()}", ln=True, align='C')
        
        pdf.set_font("Helvetica", 'I', 9)
        pdf.cell(190, 5, f"Documento gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", ln=True, align='C')
        pdf.ln(10)

        # 4. Cabeçalho da Tabela
        pdf.set_font("Helvetica", 'B', 10)
        pdf.set_fill_color(26, 26, 26) # Preto
        pdf.set_text_color(255, 255, 255) # Branco
        
        pdf.cell(30, 10, "DATA", 1, 0, 'C', True)
        pdf.cell(100, 10, "PRODUTOS ADQUIRIDOS", 1, 0, 'C', True)
        pdf.cell(60, 10, "VALOR DO PEDIDO", 1, 1, 'C', True)

        # 5. Listagem dos Pedidos
        pdf.set_font("Helvetica", '', 9)
        pdf.set_text_color(0, 0, 0)
        investimento_total = 0

        for p in meus_vendas:
            data_pedido = p['data'].strftime("%d/%m/%Y")
            
            # Concatena nomes dos itens para caber na célula
            nomes_itens = ", ".join([f"{item['qtd']}x {item['nome']}" for item in p['itens']])
            if len(nomes_itens) > 55:
                nomes_itens = nomes_itens[:52] + "..."

            pdf.cell(30, 10, data_pedido, 1, 0, 'C')
            pdf.cell(100, 10, nomes_itens, 1, 0, 'L')
            pdf.cell(60, 10, f"R$ {p['total']:.2f}", 1, 1, 'R')
            
            investimento_total += p['total']

        # 6. Rodapé com Resumo Analítico
        pdf.ln(10)
        pdf.set_draw_color(236, 72, 153)
        pdf.set_line_width(0.5)
        pdf.line(130, pdf.get_y(), 200, pdf.get_y()) # Linha decorativa
        
        pdf.set_font("Helvetica", 'B', 11)
        pdf.cell(130, 10, "TOTAL INVESTIDO NA DOCERIA:", 0, 0, 'R')
        pdf.set_text_color(236, 72, 153)
        pdf.cell(60, 10, f"R$ {investimento_total:.2f}", 0, 1, 'R')

        # 7. Retorno do Arquivo
        pdf_bytes = pdf.output()
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"meu_historico_sabor_e_arte.pdf"
        )

    except Exception as e:
        return jsonify({"error": f"Erro ao processar histórico: {str(e)}"}), 500


# ================= RELATÓRIO PDF (MELHORADO) =================
@app.route('/api/relatorio/vendas', methods=['GET'])
def relatorio_vendas():
    try:
        # 1. Configuração inicial do PDF (fpdf2)
        pdf = FPDF(orientation='P', unit='mm', format='A4')
        pdf.add_page()
        pdf.set_font("Helvetica", 'B', 16)
        
        # Título
        pdf.cell(190, 10, "DOCERIA SAAS - RELATORIO DE VENDAS", ln=True, align='C')
        pdf.set_font("Helvetica", '', 10)
        pdf.cell(190, 10, f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", ln=True, align='C')
        pdf.ln(5)

        # 2. Cabeçalho da Tabela com cores para melhor visualização
        pdf.set_font("Helvetica", 'B', 9)
        pdf.set_fill_color(200, 220, 255) # Azul claro
        
        # Ajuste exato das larguras (Soma = 190mm)
        pdf.cell(20, 10, "DATA", 1, 0, 'C', True)
        pdf.cell(35, 10, "CLIENTE", 1, 0, 'C', True)
        pdf.cell(55, 10, "PRODUTO", 1, 0, 'C', True)
        pdf.cell(15, 10, "QTD", 1, 0, 'C', True)
        pdf.cell(30, 10, "PREÇO UN.", 1, 0, 'C', True)
        pdf.cell(35, 10, "TOTAL ITEM", 1, 1, 'C', True)

        # 3. Dados dos Pedidos
        pdf.set_font("Helvetica", '', 9)
        total_geral = 0
        vendas = list(pedidos.find())

        if not vendas:
            pdf.cell(190, 10, "Nenhum pedido encontrado no período.", 1, 1, 'C')
        else:
            for p in vendas:
                user = usuarios.find_one({"_id": p['usuario_id']})
                nome_cliente = (user['nome'][:15] + '..') if user and len(user['nome']) > 15 else (user['nome'] if user else "N/A")
                data_fmt = p['data'].strftime("%d/%m/%y")
                
                for item in p['itens']:
                    subtotal = item['qtd'] * item['preco']
                    total_geral += subtotal
                    
                    # Nome do produto abreviado se for muito longo
                    nome_prod = (item['nome'][:25] + '..') if len(item['nome']) > 25 else item['nome']
                    
                    pdf.cell(20, 8, data_fmt, 1, 0, 'C')
                    pdf.cell(35, 8, nome_cliente, 1, 0, 'L')
                    pdf.cell(55, 8, nome_prod, 1, 0, 'L')
                    pdf.cell(15, 8, str(item['qtd']), 1, 0, 'C')
                    pdf.cell(30, 8, f"R$ {item['preco']:.2f}", 1, 0, 'R')
                    pdf.cell(35, 8, f"R$ {subtotal:.2f}", 1, 1, 'R')

        # 4. Rodapé com Total Geral
        pdf.ln(5)
        pdf.set_font("Helvetica", 'B', 11)
        pdf.cell(155, 10, "FATURAMENTO TOTAL ACUMULADO:", 0, 0, 'R')
        pdf.set_text_color(0, 102, 0) # Verde escuro
        pdf.cell(35, 10, f"R$ {total_geral:.2f}", 0, 1, 'R')

        # 5. O PULO DO GATO: Gerar bytes puros
        # Na fpdf2, o output() sem argumentos retorna os bytes do PDF
        pdf_bytes = pdf.output()
        
        # Criar o buffer binário
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"relatorio_vendas_{datetime.now().strftime('%Y%m%d')}.pdf"
        )

    except Exception as e:
        print(f"Erro ao gerar PDF: {str(e)}")
        return jsonify({"error": "Erro interno ao gerar o arquivo"}), 500


@app.route('/api/relatorio/precos', methods=['GET'])
def relatorio_precos():
    try:
        # 1. Configuração inicial do PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(190, 10, u"Tabela de Preços Atualizada", ln=True, align='C')
        pdf.ln(10)

        # 2. Cabeçalho da Tabela
        pdf.set_font("Arial", 'B', 10)
        pdf.set_fill_color(240, 240, 240)  # Cinza claro para o topo
        pdf.cell(80, 10, "Produto", 1, 0, 'C', True)
        pdf.cell(60, 10, "Categoria", 1, 0, 'C', True)
        pdf.cell(40, 10, "Preco", 1, 0, 'C', True)
        pdf.ln()

        # 3. Corpo da Tabela com Tratamento de Erros
        pdf.set_font("Arial", '', 10)
        
        # Buscamos todos os produtos do MongoDB
        lista_produtos = list(produtos.find())

        for prod in lista_produtos:
            # Tratamento do Nome e Categoria (garante que sejam strings)
            nome = str(prod.get('nome', 'Sem Nome'))
            categoria = str(prod.get('tipoProduto', 'Geral'))
            
            # SOLUÇÃO DO ERRO: Conversão segura de Preço
            try:
                # Tentamos converter para float (resolve se for string no banco)
                valor_bruto = prod.get('preco', 0)
                
                # Se for string com vírgula (ex: "15,50"), trocamos por ponto
                if isinstance(valor_bruto, str):
                    valor_bruto = valor_bruto.replace(',', '.')
                
                preco_float = float(valor_bruto)
                preco_texto = f"R$ {preco_float:.2f}"
            except (ValueError, TypeError):
                # Caso o dado seja totalmente inválido (ex: "A combinar")
                # Pegamos o valor bruto como string para não travar o PDF
                preco_texto = f"R$ {prod.get('preco', '0.00')}"

            # Escrita das células no PDF
            pdf.cell(80, 10, nome, 1)
            pdf.cell(60, 10, categoria, 1)
            pdf.cell(40, 10, preco_texto, 1)
            pdf.ln()

        # 4. Preparação do arquivo para envio
        # Importante: No FPDF moderno, output(dest='S') retorna os bytes
        pdf_output = pdf.output(dest='S')
        if isinstance(pdf_output, str):
            pdf_output = pdf_output.encode('latin1') # Fallback para versões antigas

        return send_file(
            io.BytesIO(pdf_output),
            mimetype='application/pdf',
            as_attachment=True,
            download_name="tabela_precos.pdf"
        )

    except Exception as e:
        print(f"Erro fatal no PDF: {e}")
        return jsonify({"error": f"Erro interno ao gerar PDF: {str(e)}"}), 500


''' @app.route('/api/relatorio/precos', methods=['GET'])
def relatorio_precos():
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(190, 10, "Tabela de Precos Atualizada", ln=True, align='C')
        pdf.ln(10)

        pdf.set_font("Arial", 'B', 10)
        pdf.cell(80, 10, "Produto", 1)
        pdf.cell(60, 10, "Categoria", 1)
        pdf.cell(40, 10, "Preco", 1)
        pdf.ln()

        pdf.set_font("Arial", '', 10)
        for prod in produtos.find():
            pdf.cell(80, 10, str(prod['nome']), 1)
            pdf.cell(60, 10, str(prod['tipoProduto']), 1)
            pdf.cell(40, 10, f"R$ {prod['preco']:.2f}", 1)
            pdf.ln()

        pdf_bytes = pdf.output()

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name="tabela_precos.pdf"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500 '''


# ================= PRECIFICAÇÃO DINÂMICA (ADMIN) =================
@app.route('/api/produtos/precificar', methods=['POST'])
def precificar_produto():
    # 1. Validação de Segurança (Apenas Admin)
    user_id = request.headers.get('user-id')
    user = verificar_permissao(user_id, ['admin'])
    if not user:
        return jsonify({"error": "Acesso negado. Apenas administradores."}), 403

    data = request.json
    try:
        # 2. Captura de inputs dinâmicos
        ingredientes = float(data.get('ingredientes', 0))
        embalagem = float(data.get('embalagem', 0))
        
        # Porcentagens vindas do usuário (com valores padrão caso ele não envie)
        # Ex: Se o usuário enviar 30, dividimos por 100 para ter 0.3
        perc_adicional = float(data.get('porcentagem_adicional', 30)) / 100 
        perc_margem = float(data.get('porcentagem_margem', 50)) / 100
        
        id_produto = data.get('id_produto') # Opcional: Para salvar no banco

        # 3. Lógica de Cálculo
        custo_direto = ingredientes + embalagem
        valor_adicional = custo_direto * perc_adicional # Energia/Mão de Obra dinâmico
        custo_producao = custo_direto + valor_adicional
        
        valor_lucro = custo_producao * perc_margem
        preco_final = custo_producao + valor_lucro

        # 4. Atualização opcional no MongoDB
        if id_produto:
            produtos.update_one(
                {"_id": ObjectId(id_produto)},
                {"$set": {"preco": round(preco_final, 2)}}
            )

        # 5. Resposta detalhada
        return jsonify({
            "status": "sucesso",
            "calculo_detalhado": {
                "1_custo_direto": round(custo_direto, 2),
                f"2_adicional_aplicado_{data.get('porcentagem_adicional', 30)}%": round(valor_adicional, 2),
                "3_custo_total_producao": round(custo_producao, 2),
                f"4_lucro_esperado_{data.get('porcentagem_margem', 50)}%": round(valor_lucro, 2),
                "5_preco_final_sugerido": round(preco_final, 2)
            },
            "msg": f"Precificação concluída para o Admin {user['nome']}."
        })

    except Exception as e:
        return jsonify({"error": f"Erro nos dados enviados: {str(e)}"}), 400

if __name__ == "__main__":
    app.run(debug=True)
