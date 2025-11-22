const { createApp } = Vue;

createApp({
    data() {
        return {
            produtos: [],
            
            // Filtros
            filtroCategoria: '',
            filtroLojaId: '',
            filtroPrecoMin: null,
            filtroPrecoMax: null,
            
            // Sistema
            alerta: { visivel: false, mensagem: '', tipo: 'success' },
            isLoggedIn: false,
            isDark: false
        };
    },

    computed: {
        categoriasDisponiveis() {
            const cats = this.produtos.map(p => p.categoria).filter(c => c);
            return [...new Set(cats)];
        },
        lojasDisponiveis() {
            // Filtra apenas lojas válidas e remove duplicatas
            const lojas = this.produtos
                .map(p => p.lojaId)
                .filter(l => l && typeof l === 'object' && l._id);
                
            return lojas.filter((loja, index, self) => 
                index === self.findIndex(l => l._id === loja._id)
            );
        },
        produtosFiltrados() {
            return this.produtos.filter(p => {
                const categoriaOk = !this.filtroCategoria || p.categoria === this.filtroCategoria;
                
                // Verificação segura da loja
                const lojaIdAtual = (p.lojaId && p.lojaId._id) ? p.lojaId._id : p.lojaId;
                const lojaOk = !this.filtroLojaId || lojaIdAtual === this.filtroLojaId;

                const precoMin = this.filtroPrecoMin || 0;
                const precoMax = this.filtroPrecoMax || Infinity;
                const precoOk = p.preco >= precoMin && p.preco <= precoMax;
                
                return categoriaOk && lojaOk && precoOk;
            });
        }
    },

    mounted() {
        this.tokenCliente = localStorage.getItem('auth-token-cliente'); 
        this.isLoggedIn = !!this.tokenCliente; 
        
        this.isDark = localStorage.getItem('temaEscuro') === 'true';
        document.documentElement.classList.toggle('dark', this.isDark);

        this.buscarProdutosPublicos();
    },

    methods: {
        mostrarAlerta(msg, tipo = 'success') {
            this.alerta.mensagem = msg;
            this.alerta.tipo = tipo;
            this.alerta.visivel = true;
            setTimeout(() => { this.alerta.visivel = false; }, 3000);
        },

        fazerLogout() {
            localStorage.removeItem('auth-token-cliente');
            localStorage.removeItem('cliente-nome');
            this.isLoggedIn = false;
            window.location.reload();
        },

        toggleTheme() {
            this.isDark = !this.isDark;
            document.documentElement.classList.toggle('dark', this.isDark);
            localStorage.setItem('temaEscuro', this.isDark);
        },

        async buscarProdutosPublicos() {
            try {
                const res = await fetch('https://ecommerce-backend-green-iota.vercel.app/public/produtos'); 
                if (res.ok) {
                    const todosProdutos = await res.json();
                    
                    // Filtra visualmente produtos com dados quebrados (sem loja)
                    this.produtos = todosProdutos.filter(p => p.lojaId);
                }
            } catch (error) {
                console.error("Erro fetch:", error);
                this.mostrarAlerta('Não foi possível carregar o catálogo.', 'error');
            }
        },

        limparFiltros() {
            this.filtroCategoria = '';
            this.filtroLojaId = '';
            this.filtroPrecoMin = null;
            this.filtroPrecoMax = null;
        }
    }
}).mount('#app');