const { createApp } = Vue;

createApp({
  data() {
    return {
      isDark: false,
      dados: {
        faturamento: 0,
        qtdVendas: 0,
        ticketMedio: 0,
        qtdProdutos: 0,
        qtdClientes: 0,
        ultimasVendas: []
      }
    };
  },

  mounted() {
    const token = localStorage.getItem('auth-token');
    if (!token) window.location.href = 'login.html';

    this.isDark = localStorage.getItem('temaEscuro') === 'true';
    document.documentElement.classList.toggle('dark', this.isDark);

    this.carregarDashboard();
  },

  methods: {
    toggleTheme() {
      this.isDark = !this.isDark;
      document.documentElement.classList.toggle('dark', this.isDark);
      localStorage.setItem('temaEscuro', this.isDark);
    },

    formatarMoeda(valor) {
      return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    async carregarDashboard() {
      const token = localStorage.getItem('auth-token');
      
      try {
        const res = await fetch('https://ecommerce-backend-green-iota.vercel.app/api/dashboard/resumo', {
          headers: { 'auth-token': token }
        });

        if (res.ok) {
          this.dados = await res.json();
        } else {
          console.error("Erro ao carregar dashboard");
        }
      } catch (error) {
        console.error("Erro de conexão:", error);
      }
    }
  }
}).mount('#app');