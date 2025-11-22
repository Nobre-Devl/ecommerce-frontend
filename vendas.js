const { createApp } = Vue;

createApp({
  data() {
    return {
      isDark: false,
      mostrarForm: false,
      idEdicao: null, 
      listaClientes: [],
      listaProdutos: [],
      historicoVendas: [],
      clienteSelecionado: null,
      
      novaVenda: {
        vendedor: '',
        itens: [],
        formaPagamento: 'Dinheiro',
        observacoes: ''
      },
      
      alerta: {
        visivel: false,
        mensagem: '',
        tipo: 'success'
      }
    };
  },

  computed: {
    dataHoje() {
      return new Date().toLocaleDateString('pt-BR');
    },
    totalGeral() {
      return this.novaVenda.itens.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    }
  },

  mounted() {
    const token = localStorage.getItem('auth-token');
    if (!token) window.location.href = 'login.html';

    this.isDark = localStorage.getItem('temaEscuro') === 'true';
    document.documentElement.classList.toggle('dark', this.isDark);

    this.carregarDadosIniciais();
  },

  methods: {
    toggleTheme() {
      this.isDark = !this.isDark;
      document.documentElement.classList.toggle('dark', this.isDark);
      localStorage.setItem('temaEscuro', this.isDark);
    },

    mostrarAlerta(msg, tipo = 'success') {
      this.alerta.mensagem = msg;
      this.alerta.tipo = tipo;
      this.alerta.visivel = true;
      setTimeout(() => { this.alerta.visivel = false; }, 3000);
    },

    toggleForm() {
      this.mostrarForm = !this.mostrarForm;
      if (!this.mostrarForm || (this.mostrarForm && !this.idEdicao)) {
        this.limparFormulario();
        if (this.mostrarForm) this.adicionarItem();
      }
    },

    limparFormulario() {
      this.idEdicao = null;
      this.clienteSelecionado = null;
      this.novaVenda = {
        vendedor: '',
        itens: [],
        formaPagamento: 'Dinheiro',
        observacoes: ''
      };
    },

    async carregarDadosIniciais() {
      const token = localStorage.getItem('auth-token');
      const headers = { 'auth-token': token };

      try {
        const [resCli, resProd, resVendas] = await Promise.all([
          fetch('https://ecommerce-backend-green-iota.vercel.app/clientes', { headers }),
          fetch('https://ecommerce-backend-green-iota.vercel.app/produtos', { headers }),
          fetch('https://ecommerce-backend-green-iota.vercel.app/vendas', { headers }) 
        ]);

        if (resCli.ok) this.listaClientes = await resCli.json();
        if (resProd.ok) this.listaProdutos = await resProd.json();
        if (resVendas.ok) this.historicoVendas = await resVendas.json();
      } catch (error) {
        console.error(error);
      }
    },

    adicionarItem() {
      this.novaVenda.itens.push({
        produtoId: null,
        nome: '',
        quantidade: 1,
        precoUnitario: 0,
        subtotal: 0
      });
    },

    removerItem(index) {
      this.novaVenda.itens.splice(index, 1);
    },

    atualizarItem(index) {
      const item = this.novaVenda.itens[index];
      const produtoOriginal = this.listaProdutos.find(p => p._id === item.produtoId);

      if (produtoOriginal) {
        item.nome = produtoOriginal.nome;
        item.precoUnitario = Number(produtoOriginal.preco || 0); 
        item.quantidade = 1; 
        this.calcularSubtotal(index);
      }
    },

    calcularSubtotal(index) {
      const item = this.novaVenda.itens[index];
      item.subtotal = item.quantidade * item.precoUnitario;
    },

    prepararEdicao(venda) {
      this.idEdicao = venda._id;
      this.novaVenda.vendedor = venda.vendedor;
      
      this.clienteSelecionado = this.listaClientes.find(c => c._id === venda.cliente.id) || null;
      
      this.novaVenda.itens = venda.itens.map(item => ({...item}));

      this.mostrarForm = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    async excluirVenda(id) {
      if(!confirm('Tem certeza? Isso devolverá os itens ao estoque.')) return;

      const token = localStorage.getItem('auth-token');
      try {
        const res = await fetch(`https://ecommerce-backend-green-iota.vercel.app/vendas/${id}`, {
          method: 'DELETE',
          headers: { 'auth-token': token }
        });

        if(res.ok) {
          this.mostrarAlerta('Venda excluída e estoque estornado!');
          this.carregarDadosIniciais();
        } else {
          const erro = await res.json();
          this.mostrarAlerta(erro.message, 'error');
        }
      } catch(err) {
        this.mostrarAlerta('Erro ao excluir', 'error');
      }
    },

    async finalizarVenda() {
      if (!this.clienteSelecionado) return this.mostrarAlerta('Selecione um cliente!', 'error');
      
      const itensValidos = this.novaVenda.itens.filter(item => item.produtoId && item.quantidade > 0);
      if (itensValidos.length === 0) return this.mostrarAlerta('Adicione produtos válidos!', 'error');

      const payload = {
        vendedor: this.novaVenda.vendedor || 'Balcão',
        cliente: {
          id: this.clienteSelecionado._id,
          nome: this.clienteSelecionado.nome,
          cpf: this.clienteSelecionado.cpf
        },
        itens: itensValidos.map(item => ({
            produtoId: item.produtoId,
            nome: item.nome,
            quantidade: Number(item.quantidade),
            precoUnitario: Number(item.precoUnitario),
            subtotal: Number(item.subtotal)
        })),
        valorTotal: Number(this.totalGeral),
        formaPagamento: 'Dinheiro'
      };

      const token = localStorage.getItem('auth-token');
      let url = 'https://ecommerce-backend-green-iota.vercel.app/vendas';
      let method = 'POST';

      if (this.idEdicao) {
        url = `https://ecommerce-backend-green-iota.vercel.app/vendas/${this.idEdicao}`;
        method = 'PUT';
      }
      
      try {
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', 'auth-token': token },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          this.mostrarAlerta(this.idEdicao ? '✅ Venda atualizada!' : '✅ Venda realizada!');
          await this.carregarDadosIniciais();
          this.mostrarForm = false;
          this.limparFormulario();
        } else {
          const erro = await res.json();
          this.mostrarAlerta('❌ Erro: ' + erro.message, 'error');
        }
      } catch (err) {
        console.error(err);
        this.mostrarAlerta('Erro de conexão', 'error');
      }
    }
  }
}).mount('#app');