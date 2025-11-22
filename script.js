const { createApp } = Vue;

createApp({
  data() {
    return {
      produtos: [],
      filtroBusca: '',
      filtroDataInicio: '',
      filtroDataFim: '',
      filtroCategoria: '',
      filtroPrecoMin: 0,
      filtroPrecoMax: 0,
      precoMin: 0,
      precoMax: 100,
      abrirFiltros: false,
      mostrarForm: false,
      editando: false,
      produtoEditandoId: null,
      novoProduto: {
        nome: '',
        categoria: '',
        preco: 0,
        estoque: 0,
        desc: '',
        imagem: '',
        data: ''
      },
      isDark: false,
      hoje: new Date().toISOString().split('T')[0],
      
      alerta: {
        visivel: false,
        mensagem: '',
        tipo: 'success'
      }
    };
  },

  computed: {
    categoriasDisponiveis() {
      const cats = this.produtos.map(p => p.categoria).filter(c => c);
      return [...new Set(cats)];
    },

    produtosFiltrados() {
      return this.produtos.filter(p => {
        const buscaOk = p.nome.toLowerCase().includes(this.filtroBusca.toLowerCase());
        const dataProduto = p.data ? p.data.split('T')[0] : '';
        const dataInicio = this.filtroDataInicio || '0000-01-01';
        const dataFim = this.filtroDataFim || this.hoje;
        const dataOk = dataProduto >= dataInicio && dataProduto <= dataFim;
        const categoriaOk = !this.filtroCategoria || p.categoria === this.filtroCategoria;
        const precoOk = p.preco >= this.filtroPrecoMin && p.preco <= this.filtroPrecoMax;
        return buscaOk && dataOk && categoriaOk && precoOk;
      });
    },

    sliderMinPercent() {
      return ((this.filtroPrecoMin - this.precoMin) / (this.precoMax - this.precoMin)) * 100;
    },

    sliderWidthPercent() {
      return ((this.filtroPrecoMax - this.filtroPrecoMin) / (this.precoMax - this.precoMin)) * 100;
    }
  },

  mounted() {
    // --- VERIFICAÇÃO DE SEGURANÇA ---
    const token = localStorage.getItem('auth-token');
    if (!token) {
      alert('Acesso negado. Faça o login primeiro.');
      window.location.href = 'login.html';
      return;
    }
    // -------------------------------

    this.isDark = localStorage.getItem('temaEscuro') === 'true';
    document.documentElement.classList.toggle('dark', this.isDark);
    this.buscarProdutos();
  },

  methods: {
    mostrarAlerta(mensagem, tipo = 'success', duracao = 3000) {
      this.alerta.mensagem = mensagem;
      this.alerta.tipo = tipo;
      this.alerta.visivel = true;
      setTimeout(() => {
        this.alerta.visivel = false;
      }, duracao);
    },

    formatarDataLocal(dataStr) {
      if (!dataStr) return 'Sem data';
      const [year, month, day] = dataStr.split('-');
      return `${day}/${month}/${year}`;
    },

    async buscarProdutos() {
      const token = localStorage.getItem('auth-token');
      try {
        const res = await fetch('https://ecommerce-backend-green-iota.vercel.app/produtos', {
          headers: { 'auth-token': token }
        });
        
        // --- CORREÇÃO DE ERRO NO FETCH ---
        if (!res.ok) {
            // Trata erros de autenticação (401) ou servidor (500)
            const erroData = await res.json();
            this.mostrarAlerta('❌ Erro: ' + (erroData.message || 'Token expirado ou inválido'), 'error');
            // Opcional: se o token falhou, redirecionar para login
            // window.location.href = 'login.html';
            return; 
        }
        // --- FIM DA CORREÇÃO ---
        
        this.produtos = await res.json();

        const precos = this.produtos.map(p => p.preco);
        if (precos.length > 0) {
            this.precoMin = Math.min(...precos, 0);
            this.precoMax = Math.max(...precos, 100);
            this.filtroPrecoMin = this.precoMin;
            this.filtroPrecoMax = this.precoMax;
        } else {
            // Garante que os valores iniciais de filtro sejam definidos
            this.precoMin = 0;
            this.precoMax = 100;
            this.filtroPrecoMin = 0;
            this.filtroPrecoMax = 100;
        }
      } catch (error) {
        console.error('Erro ao buscar:', error);
        this.mostrarAlerta('❌ Falha ao conectar com o servidor.', 'error');
      }
    },

    limparFiltros() {
      this.filtroBusca = '';
      this.filtroDataInicio = '';
      this.filtroDataFim = '';
      this.filtroCategoria = '';
      this.resetPreco();
    },

    resetPreco() {
      this.filtroPrecoMin = this.precoMin;
      this.filtroPrecoMax = this.precoMax;
    },

    corrigirMinMax(tipo) {
      if (tipo === 'min' && this.filtroPrecoMin > this.filtroPrecoMax)
        this.filtroPrecoMin = this.filtroPrecoMax;
      if (tipo === 'max' && this.filtroPrecoMax < this.filtroPrecoMin)
        this.filtroPrecoMax = this.filtroPrecoMin;
    },

    toggleForm() {
      this.mostrarForm = !this.mostrarForm;
      if (!this.mostrarForm) this.resetarFormulario();
    },

    async carregarImagem(event) {
      const file = event.target.files[0];
      if (!file) return;

      const options = {
        maxSizeMB: 0.5, // Limita a 0.5MB (500KB) para ficar leve
        maxWidthOrHeight: 1200, // Redimensiona se for muito grande
        useWebWorker: true
      };

      try {
        this.mostrarAlerta('Processando imagem...', 'warning', 2000);
        
        const compressedFile = await imageCompression(file, options);

        const reader = new FileReader();
        reader.onload = e => {
          this.novoProduto.imagem = e.target.result;
        };
        reader.readAsDataURL(compressedFile);

      } catch (error) {
        console.error('Erro na imagem:', error);
        this.mostrarAlerta('Erro ao processar imagem.', 'error');
      }
    },

    async salvarProduto() {
      const token = localStorage.getItem('auth-token');

      if (!this.novoProduto.data) this.novoProduto.data = new Date().toISOString();

      const metodo = this.editando ? 'PUT' : 'POST';
      const url = this.editando
        ? `https://ecommerce-backend-green-iota.vercel.app/produtos/${this.produtoEditandoId}`
        : 'https://ecommerce-backend-green-iota.vercel.app/produtos';

      try {
        const res = await fetch(url, {
          method: metodo,
          headers: { 
            'Content-Type': 'application/json',
            'auth-token': token
          },
          body: JSON.stringify(this.novoProduto)
        });

        if (res.ok) {
          const msg = this.editando ? '✅ Produto atualizado!' : '✅ Produto cadastrado!';
          this.mostrarAlerta(msg, 'success');
          
          this.buscarProdutos();
          this.toggleForm();
        } else {
          const erroData = await res.json();
          this.mostrarAlerta('❌ ' + (erroData.message || 'Erro ao salvar'), 'error');
        }
      } catch (error) {
        this.mostrarAlerta('❌ Erro de conexão com o servidor', 'error');
      }
    },

    editarProduto(prod) {
      this.mostrarForm = true;
      this.editando = true;
      this.produtoEditandoId = prod._id;
      this.novoProduto = { ...prod };
    },

    async excluirProduto(id) {
      const token = localStorage.getItem('auth-token');
      if (!confirm('Tem certeza que deseja excluir este produto?')) return;

      try {
        const res = await fetch(`https://ecommerce-backend-green-iota.vercel.app/produtos/${id}`, { 
            method: 'DELETE',
            headers: { 'auth-token': token }
        });

        if (res.ok) {
          this.mostrarAlerta('🗑️ Produto excluído!', 'success');
          this.buscarProdutos();
        } else {
          const erroData = await res.json();
          this.mostrarAlerta('❌ ' + (erroData.message || 'Erro ao excluir produto.'), 'error');
        }
      } catch (error) {
        this.mostrarAlerta('❌ Erro de conexão.', 'error');
      }
    },

    resetarFormulario() {
      this.editando = false;
      this.produtoEditandoId = null;
      this.novoProduto = {
        nome: '',
        categoria: '',
        preco: 0,
        estoque: 0,
        desc: '',
        imagem: '',
        data: ''
      };
    },

    toggleTheme() {
      this.isDark = !this.isDark;
      document.documentElement.classList.toggle('dark', this.isDark);
      localStorage.setItem('temaEscuro', this.isDark);
    },

    formatarData(dataStr) {
      if (!dataStr) return 'Sem data';
      const data = new Date(dataStr);
      if (isNaN(data)) return 'Data inválida';
      return data.toLocaleDateString('pt-BR');
    }
  }
}).mount('#app');