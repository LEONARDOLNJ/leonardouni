import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "pt" | "en" | "fr" | "es";

/** Portuguese source string -> English translation. */
const EN: Record<string, string> = {
  // navigation / chrome
  "Painel": "Dashboard",
  "Orientador IA": "AI Advisor",
  "Estudantes": "Students",
  "Propinas & Taxas": "Tuition & Fees",
  "Pagamentos": "Payments",
  "Recibos": "Receipts",
  "Documentos": "Documents",
  "Subscrições": "Subscriptions",
  "Subscrições Base Pay": "Base Pay Subscriptions",
  "Login": "Login",
  "Portal do Estudante": "Student Portal",
  "Sair": "Logout",
  "Entrar": "Sign In",
  "Esqueceu a Senha?": "Forgot Password?",
  "Recuperar Conta": "Recover Account",
  "Sistema de Gestão · Módulo Financeiro": "Management System · Finance Module",
  "Leonardo University": "Leonardo University",
  "Portal do estudante": "Student portal",
  "Apoio financeiro": "Financial support",
  "Contactos": "Contact us",
  "Idioma": "Language",
  "Modo Escuro": "Dark Mode",
  "Modo Claro": "Light Mode",
  "Claro": "Light",
  "Escuro": "Dark",
  "Estudante Internacional": "International Student",
  "Estudantes Internacionais": "International Students",
  "Nacionalidade": "Nationality",
  "Passaporte / Visto": "Passport / Visa",
  "Candidaturas abertas para o ano lectivo 2026": "Applications open for the 2026 academic year",
  "Saiba mais": "Find out more",
  "Ligações rápidas": "Quick links",
  "Todos os direitos reservados.": "All rights reserved.",

  // Voice AI
  "Voz IA": "AI Voice",
  "Comando de Voz IA": "AI Voice Command",
  "Ativar Voz IA": "Enable AI Voice",
  "Desativar Voz IA": "Disable AI Voice",
  "A ouvir... Fale agora": "Listening... Speak now",
  "A processar comando...": "Processing command...",
  "A responder...": "Responding...",
  "Diga um comando (ex: 'Ir para pagamentos', 'Ver propinas', 'Modo escuro')": "Say a command (e.g. 'Go to payments', 'View tuition', 'Dark mode')",
  "Comandos disponíveis": "Available commands",
  "Ir para o Painel": "Go to Dashboard",
  "Abrir Orientador IA": "Open AI Advisor",
  "Ver Propinas": "View Tuition",
  "Ver Pagamentos": "View Payments",
  "Mudar para Inglês": "Switch to English",
  "Ativar Modo Escuro": "Enable Dark Mode",
  "Repetir Resposta": "Repeat Response",
  "Parar Voz": "Stop Voice",
  "Fale para navegar, mudar definições ou fazer perguntas sobre a Universidade.": "Speak to navigate, change settings or ask questions about the University.",
  "Clique no microfone para falar": "Click the microphone to speak",
  "A navegar para o Painel...": "Navigating to Dashboard...",
  "A abrir o Orientador IA...": "Opening AI Advisor...",
  "A abrir Propinas e Taxas...": "Opening Tuition & Fees...",
  "A abrir estado de Pagamentos...": "Opening Payment status...",
  "A abrir lista de Estudantes...": "Opening Student list...",
  "A abrir Recibos emitidos...": "Opening issued Receipts...",
  "A abrir Documentos...": "Opening Documents...",
  "A abrir Subscrições...": "Opening Subscriptions...",
  "A abrir Portal do Estudante...": "Opening Student Portal...",
  "Modo Escuro activado.": "Dark Mode enabled.",
  "Modo Claro activado.": "Light Mode enabled.",
  "Voz processada sem resposta.": "Voice processed without response.",
  "Erro ao enviar o áudio de voz.": "Error sending voice audio.",
  "Não consegui compreender o comando.": "Could not understand command.",
  "Erro ao consultar a IA por voz.": "Error querying AI by voice.",

  // AI Advisor & Choice Simulator
  "Orientador IA do Estudante · Leonardo University": "AI Student Advisor · Leonardo University",
  "Guia de Escolhas & Orientação Financeira Inteligente": "Choices Guide & Smart Financial Counseling",
  "Insira o seu curso, ano lectivo e preferências financeiras para receber recomendações personalizadas, estimativa de encargos, alertas de prazo e estratégias de pagamento.": "Enter your course, academic year, and financial preferences to receive personalized recommendations, charge estimates, deadline alerts, and payment strategies.",
  "Fechar Assistente IA": "Close AI Assistant",
  "Conversar com Orientador IA": "Chat with AI Advisor",
  "Consultas / Prompts IA restantes neste ciclo": "Remaining AI Prompts / Queries in this cycle",
  "Subscrever / Recarregar com Base Pay": "Subscribe / Recharge with Base Pay",
  "Configure as suas Escolhas": "Configure Your Choices",
  "Curso Académico": "Academic Programme",
  "Ano de Estudo": "Year of Study",
  "Método de Pagamento": "Payment Method",
  "Preferência / Situação Financeira": "Preference / Financial Situation",
  "Pagamento parcelado por semestre (18.500 MZN/semestre)": "Semester installment payment (18,500 MZN/semester)",
  "Pagamento integral anual único": "Single full annual payment",
  "Pedido de extensão de prazo / Necessidade de apoio": "Deadline extension request / Financial support needed",
  "Ajuste para Propinas + Taxas específicas do curso": "Adjustment for Tuition + Course-specific fees",
  "Dúvida ou Nota Adicional (Opcional)": "Additional Question or Note (Optional)",
  "A analisar opções com IA...": "Analyzing options with AI...",
  "Gerar Orientação Personalizada IA": "Generate Personalized AI Guidance",
  "Plano & Orientação Recomendada": "Recommended Plan & Guidance",
  "A processar e estruturar o plano financeiro na Leonardo University...": "Processing and structuring financial plan at Leonardo University...",
  "Analisando prazos de propinas, taxas do curso e melhores formas de liquidação.": "Analyzing tuition deadlines, course fees and best settlement methods.",
  "Nenhum plano gerado ainda": "No plan generated yet",
  "Seleccione o seu curso e preferências à esquerda e clique em 'Gerar Orientação Personalizada IA' para receber um plano financeiro detalhado.": "Select your program and preferences on the left and click 'Generate Personalized AI Guidance' to receive a detailed financial plan.",
  "Custos Precisos": "Accurate Costs",
  "Propinas e taxas por curso": "Tuition and fees per course",
  "Prazos Alertas": "Deadline Alerts",
  "Evite multas de mora": "Avoid late fee penalties",
  "Métodos Locais": "Local Methods",
  "M-Pesa, e-Mola, Bancos": "M-Pesa, e-Mola, Banks",
  "Conversa em Tempo Real com Orientador IA": "Real-time Chat with AI Advisor",
  "Fechar": "Close",
  "Dúvidas frequentes": "Frequently asked questions",
  "O Orientador IA está a escrever...": "AI Advisor is writing...",
  "Enviar": "Send",
  "Planos de Subscrição IA do Estudante": "Student AI Subscription Tiers",
  "Pague via Cartão ou Dólar Digital (USDC) em Base Sepolia ou Base Mainnet. Rentabilidade garantida para sustentabilidade da IA.": "Pay via Card or Digital Dollar (USDC) on Base Sepolia or Base Mainnet. Guaranteed sustainability for AI operations.",
  "Abrir Modal do Base Pay": "Open Base Pay Modal",
  "Recomendado": "Recommended",
  "Prompts IA": "AI Prompts",
  "mês": "month",
  "Subscrever por": "Subscribe for",

  // dashboard
  "Painel de Pagamentos": "Payments Dashboard",
  "Visão consolidada de propinas, taxas e estado de cobrança do ano lectivo corrente.":
    "A consolidated view of tuition, fees and collection status for the current academic year.",
  "Total facturado": "Total invoiced",
  "Recebido": "Received",
  "Pendente": "Pending",
  "Vencido": "Overdue",
  "encargos lançados": "charges issued",
  "da facturação": "of invoiced value",
  "aguarda liquidação": "awaiting settlement",
  "requer notificação": "requires notification",
  "Taxa de cobrança": "Collection rate",
  "Saldos por regularizar": "Outstanding balances",
  "Ver todos os pagamentos": "View all payments",
  "Estudante": "Student",
  "Encargo": "Charge",
  "Vencimento": "Due date",
  "Em dívida": "Outstanding",
  "Estado": "Status",
  "Cobrança por curso": "Collection by programme",
  "O plano do sistema e os modelos de papel timbrado estão disponíveis para descarga em PDF.":
    "The system plan and letterhead templates are available to download as PDF.",
  "Abrir documentos": "Open documents",
  "Vida no campus": "Campus life",
  "Apoio ao estudante": "Student support",
  "Serviços financeiros": "Financial services",
  "Uma universidade construída à volta dos seus estudantes.":
    "A university built around its students.",
  "Gestão transparente de propinas, taxas e recibos — tudo num só portal.":
    "Transparent management of tuition, fees and receipts — all in one portal.",

  // students & login
  "Registo académico e situação financeira de cada estudante matriculado.":
    "Academic record and financial position of every enrolled student.",
  "estudantes matriculados": "enrolled students",
  "Nº de estudante": "Student no.",
  "Nome": "Name",
  "Curso": "Programme",
  "Ano": "Year",
  "Email": "Email",
  "Senha": "Password",
  "Introduza o seu email ou N.º de estudante": "Enter your email or Student ID",
  "Introduza a sua senha": "Enter your password",
  "Entrar no Portal do Estudante": "Sign into Student Portal",
  "Acesso de Teste Rápido (Demonstração)": "Quick Test Access (Demo)",
  "Instruções para Recuperação de Senha": "Password Recovery Instructions",
  "Enviar Link de Recuperação": "Send Recovery Link",
  "Um email de redefinição de senha foi enviado para": "A password reset email was sent to",

  // fees & payments
  "Configuração dos encargos lectivos: propinas por semestre e taxas administrativas adicionais.":
    "Configuration of academic charges: tuition per semester and additional administrative fees.",
  "Propinas": "Tuition",
  "Taxas": "Fees",
  "registos": "records",
  "Código": "Code",
  "Designação": "Description",
  "Abrangência": "Applies to",
  "Valor": "Amount",
  "Estado dos Pagamentos": "Payment Status",
  "Registo de todas as transacções, método de pagamento e saldo remanescente por encargo.":
    "A record of every transaction, payment method and remaining balance per charge.",
  "todos": "all",
  "pago": "paid",
  "pendente": "pending",
  "vencido": "overdue",
  "transacções": "transactions",
  "Referência": "Reference",
  "Data": "Date",
  "Método": "Method",
  "Pago": "Paid",
  "Recibo": "Receipt",
  "Cartão": "Card",
  "Mobile Money": "Mobile Money",
  "Transferência Bancária": "Bank Transfer",
  "Disparar Lembrete SMS / M-Pesa": "Trigger SMS / M-Pesa Reminder",
  "Configurar M-Pesa & Cartões Moçambique": "Configure M-Pesa & Mozambique Cards",
  "Pagar Factura": "Pay Invoice",
  "Simular Taxas": "Calculate Fees",
  "Solicitar Bolsa": "Apply for Scholarship",
  "Cartão de Estudante": "Student ID Card",
  "Emitir Recibo": "Issue Receipt",

  // receipts & docs
  "Comprovativos emitidos automaticamente após a liquidação de uma propina ou taxa.":
    "Proof of payment issued automatically once a tuition charge or fee is settled.",
  "recibos emitidos": "receipts issued",
  "Descarregar PDF": "Download PDF",

  // courses
  "Engenharia Informática": "Computer Engineering",
  "Gestão de Empresas": "Business Management",
  "Direito": "Law",
  "Medicina": "Medicine",
  "Arquitectura": "Architecture",
  "Todos": "All",

  // fee designations
  "Propina · 1º Semestre": "Tuition · Semester 1",
  "Propina · 2º Semestre": "Tuition · Semester 2",
  "Propina Clínica (acréscimo)": "Clinical tuition (supplement)",
  "Taxa de Inscrição Anual": "Annual registration fee",
  "Taxa de Biblioteca": "Library fee",
  "Taxa de Laboratório": "Laboratory fee",
  "Taxa de Certificação de Documentos": "Document certification fee",
};

/** Portuguese source string -> French translation. */
const FR: Record<string, string> = {
  // navigation / chrome
  "Painel": "Tableau de bord",
  "Orientador IA": "Conseiller IA",
  "Estudantes": "Étudiants",
  "Propinas & Taxas": "Frais de scolarité",
  "Pagamentos": "Paiements",
  "Recibos": "Reçus",
  "Documentos": "Documents",
  "Subscrições": "Abonnements",
  "Subscrições Base Pay": "Abonnements Base Pay",
  "Login": "Connexion",
  "Portal do Estudante": "Portail Étudiant",
  "Sair": "Déconnexion",
  "Entrar": "Se connecter",
  "Esqueceu a Senha?": "Mot de passe oublié ?",
  "Recuperar Conta": "Récupérer le compte",
  "Sistema de Gestão · Módulo Financeiro": "Système de Gestion · Module Financier",
  "Leonardo University": "Leonardo University",
  "Portal do estudante": "Portail étudiant",
  "Apoio financeiro": "Aide financière",
  "Contactos": "Contactez-nous",
  "Idioma": "Langue",
  "Modo Escuro": "Mode Sombre",
  "Modo Claro": "Mode Clair",
  "Claro": "Clair",
  "Escuro": "Sombre",
  "Estudante Internacional": "Étudiant International",
  "Estudantes Internacionais": "Étudiants Internationaux",
  "Nacionalidade": "Nationalité",
  "Passaporte / Visto": "Passeport / Visa",
  "Candidaturas abertas para o ano lectivo 2026": "Candidatures ouvertes pour l'année académique 2026",
  "Saiba mais": "En savoir plus",
  "Ligações rápidas": "Liens rapides",
  "Todos os direitos reservados.": "Tous droits réservés.",

  // Voice AI
  "Voz IA": "Voix IA",
  "Comando de Voz IA": "Commande Vocale IA",
  "Ativar Voz IA": "Activer la voix IA",
  "Desativar Voz IA": "Désactiver la voix IA",
  "A ouvir... Fale agora": "À l'écoute... Parlez maintenant",
  "A processar comando...": "Traitement de la commande...",
  "A responder...": "En réponse...",
  "Diga um comando (ex: 'Ir para pagamentos', 'Ver propinas', 'Modo escuro')": "Dites une commande (ex: 'Aller aux paiements', 'Voir les frais')",
  "Comandos disponíveis": "Commandes disponibles",
  "Ir para o Painel": "Aller au Tableau de bord",
  "Abrir Orientador IA": "Ouvrir le Conseiller IA",
  "Ver Propinas": "Voir les Frais de scolarité",
  "Ver Pagamentos": "Voir les Paiements",
  "Mudar para Inglês": "Passer à l'Anglais",
  "Ativar Modo Escuro": "Activer le Mode Sombre",
  "Repetir Resposta": "Répéter la réponse",
  "Parar Voz": "Arrêter la voix",

  // dashboard
  "Painel de Pagamentos": "Tableau de bord des paiements",
  "Visão consolidada de propinas, taxas e estado de cobrança do ano lectivo corrente.":
    "Vue consolidée des frais de scolarité et de l'état de recouvrement pour l'année académique.",
  "Total facturado": "Total facturé",
  "Recebido": "Reçu",
  "Pendente": "En attente",
  "Vencido": "En retard",
  "encargos lançados": "frais émis",
  "da facturação": "de la facturation",
  "aguarda liquidação": "en attente de règlement",
  "requer notificação": "nécessite une notification",
  "Taxa de cobrança": "Taux de recouvrement",
  "Saldos por regularizar": "Soldes à régulariser",
  "Ver todos os pagamentos": "Voir tous les paiements",
  "Estudante": "Étudiant",
  "Encargo": "Frais",
  "Vencimento": "Date d'échéance",
  "Em dívida": "En dette",
  "Estado": "Statut",
  "Cobrança por curso": "Recouvrement par programme",
  "O plano do sistema e os modelos de papel timbrado estão disponíveis para descarga em PDF.":
    "Le plan du système et les modèles d'en-tête sont disponibles en téléchargement PDF.",
  "Abrir documentos": "Ouvrir les documents",
  "Vida no campus": "Vie de campus",
  "Apoio ao estudante": "Soutien aux étudiants",
  "Serviços financeiros": "Services financiers",
  "Uma universidade construída à volta dos seus estudantes.":
    "Une université conçue autour de ses étudiants.",
  "Gestão transparente de propinas, taxas e recibos — tudo num só portal.":
    "Gestion transparente des frais de scolarité, des reçus — le tout sur un seul portail.",

  // students & login
  "Registo académico e situação financeira de cada estudante matriculado.":
    "Dossier académique et situation financière de chaque étudiant inscrit.",
  "estudantes matriculados": "étudiants inscrits",
  "Nº de estudante": "N° d'étudiant",
  "Nome": "Nom",
  "Curso": "Programme",
  "Ano": "Année",
  "Email": "E-mail",
  "Senha": "Mot de passe",
  "Introduza o seu email ou N.º de estudante": "Entrez votre e-mail ou N° d'étudiant",
  "Introduza a sua senha": "Entrez votre mot de passe",
  "Entrar no Portal do Estudante": "Connexion au Portail Étudiant",
  "Acesso de Teste Rápido (Demonstração)": "Accès de Test Rapide (Démonstration)",
  "Instruções para Recuperação de Senha": "Instructions de récupération du mot de passe",
  "Enviar Link de Recuperação": "Envoyer le lien de réinitialisation",
  "Um email de redefinição de senha foi enviado para": "Un e-mail de réinitialisation a été envoyé à",

  // fees & payments
  "Configuração dos encargos lectivos: propinas por semestre e taxas administrativas adicionais.":
    "Configuration des frais académiques : frais de scolarité semestriels et frais administratifs.",
  "Propinas": "Frais de scolarité",
  "Taxas": "Frais annexes",
  "registos": "enregistrements",
  "Código": "Code",
  "Designação": "Désignation",
  "Abrangência": "Concerne",
  "Valor": "Montant",
  "Estado dos Pagamentos": "Statut des paiements",
  "Registo de todas as transacções, método de pagamento e saldo remanescente por encargo.":
    "Registre de toutes les transactions, mode de paiement et solde restant dû.",
  "todos": "tous",
  "pago": "payé",
  "pendente": "en attente",
  "vencido": "en retard",
  "transacções": "transactions",
  "Referência": "Référence",
  "Data": "Date",
  "Método": "Méthode",
  "Pago": "Payé",
  "Recibo": "Reçu",
  "Cartão": "Carte bancaire",
  "Mobile Money": "Paiement Mobile",
  "Transferência Bancária": "Virement Bancaire",
  "Disparar Lembrete SMS / M-Pesa": "Rappel SMS / M-Pesa",
  "Configurar M-Pesa & Cartões Moçambique": "Configurer M-Pesa & Cartes",
  "Pagar Factura": "Payer la facture",
  "Simular Taxas": "Calculer les frais",
  "Solicitar Bolsa": "Demander une bourse",
  "Cartão de Estudante": "Carte d'étudiant",
  "Emitir Recibo": "Émettre un reçu",

  // receipts & docs
  "Comprovativos emitidos automaticamente após a liquidação de uma propina ou taxa.":
    "Preuves de paiement émises automatiquement après le règlement.",
  "recibos emitidos": "reçus émis",
  "Descarregar PDF": "Télécharger le PDF",

  // courses
  "Engenharia Informática": "Génie Informatique",
  "Gestão de Empresas": "Gestion des Entreprises",
  "Direito": "Droit",
  "Medicina": "Médecine",
  "Arquitectura": "Architecture",
  "Todos": "Tous",

  // fee designations
  "Propina · 1º Semestre": "Scolarité · 1er Semestre",
  "Propina · 2º Semestre": "Scolarité · 2ème Semestre",
  "Propina Clínica (acréscimo)": "Frais de clinique (supplément)",
  "Taxa de Inscrição Anual": "Frais d'inscription annuelle",
  "Taxa de Biblioteca": "Frais de bibliothèque",
  "Taxa de Laboratório": "Frais de laboratoire",
  "Taxa de Certificação de Documentos": "Frais de certification de documents",
};

/** Portuguese source string -> Spanish translation. */
const ES: Record<string, string> = {
  // navigation / chrome
  "Painel": "Panel de Control",
  "Orientador IA": "Asesor IA",
  "Estudantes": "Estudiantes",
  "Propinas & Taxas": "Colegiaturas y Tasas",
  "Pagamentos": "Pagos",
  "Recibos": "Recibos",
  "Documentos": "Documentos",
  "Subscrições": "Suscripciones",
  "Subscrições Base Pay": "Suscripciones Base Pay",
  "Login": "Iniciar Sesión",
  "Portal do Estudante": "Portal del Estudiante",
  "Sair": "Cerrar Sesión",
  "Entrar": "Ingresar",
  "Esqueceu a Senha?": "¿Olvidó su contraseña?",
  "Recuperar Conta": "Recuperar Cuenta",
  "Sistema de Gestão · Módulo Financeiro": "Sistema de Gestión · Módulo Financiero",
  "Leonardo University": "Leonardo University",
  "Portal do estudante": "Portal del estudiante",
  "Apoio financeiro": "Apoyo financiero",
  "Contactos": "Contactos",
  "Idioma": "Idioma",
  "Modo Escuro": "Modo Oscuro",
  "Modo Claro": "Modo Claro",
  "Claro": "Claro",
  "Escuro": "Oscuro",
  "Estudante Internacional": "Estudiante Internacional",
  "Estudantes Internacionais": "Estudiantes Internacionales",
  "Nacionalidade": "Nacionalidad",
  "Passaporte / Visto": "Pasaporte / Visa",
  "Candidaturas abertas para o ano lectivo 2026": "Solicitudes abiertas para el año académico 2026",
  "Saiba mais": "Más información",
  "Ligações rápidas": "Enlaces rápidos",
  "Todos os direitos reservados.": "Todos los derechos reservados.",

  // Voice AI
  "Voz IA": "Voz IA",
  "Comando de Voz IA": "Comando de Voz IA",
  "Ativar Voz IA": "Activar Voz IA",
  "Desativar Voz IA": "Desactivar Voz IA",
  "A ouvir... Fale agora": "Escuchando... Hable ahora",
  "A processar comando...": "Procesando comando...",
  "A responder...": "Respondiendo...",
  "Diga um comando (ex: 'Ir para pagamentos', 'Ver propinas', 'Modo escuro')": "Diga un comando (ej: 'Ir a pagos', 'Ver colegiaturas')",
  "Comandos disponíveis": "Comandos disponibles",
  "Ir para o Painel": "Ir al Panel de Control",
  "Abrir Orientador IA": "Abrir Asesor IA",
  "Ver Propinas": "Ver Colegiaturas",
  "Ver Pagamentos": "Ver Pagos",
  "Mudar para Inglês": "Cambiar a Inglés",
  "Ativar Modo Escuro": "Activar Modo Oscuro",
  "Repetir Resposta": "Repetir Respuesta",
  "Parar Voz": "Detener Voz",

  // dashboard
  "Painel de Pagamentos": "Panel de Pagos",
  "Visão consolidada de propinas, taxas e estado de cobrança do ano lectivo corrente.":
    "Visión consolidada de colegiaturas, tasas y estado de cobro del año académico.",
  "Total facturado": "Total facturado",
  "Recebido": "Recibido",
  "Pendente": "Pendiente",
  "Vencido": "Vencido",
  "encargos lançados": "cargos emitidos",
  "da facturação": "de la facturación",
  "aguarda liquidação": "espera liquidación",
  "requer notificação": "requiere notificación",
  "Taxa de cobrança": "Tasa de cobro",
  "Saldos por regularizar": "Saldos por regularizar",
  "Ver todos os pagamentos": "Ver todos los pagos",
  "Estudante": "Estudiante",
  "Encargo": "Cargo",
  "Vencimento": "Fecha de vencimiento",
  "Em dívida": "En deuda",
  "Estado": "Estado",
  "Cobrança por curso": "Cobro por programa",
  "O plano do sistema e os modelos de papel timbrado estão disponíveis para descarga em PDF.":
    "El plan del sistema y los modelos de membrete están disponibles para descarga en PDF.",
  "Abrir documentos": "Abrir documentos",
  "Vida no campus": "Vida en el campus",
  "Apoio ao estudante": "Apoyo al estudiante",
  "Serviços financeiros": "Servicios financieros",
  "Uma universidade construída à volta dos seus estudantes.":
    "Una universidad diseñada para sus estudiantes.",
  "Gestão transparente de propinas, taxas e recibos — tudo num só portal.":
    "Gestión transparente de colegiaturas, tasas y recibos — todo en un solo portal.",

  // students & login
  "Registo académico e situação financeira de cada estudante matriculado.":
    "Registro académico y posición financiera de cada estudiante matriculado.",
  "estudantes matriculados": "estudiantes matriculados",
  "Nº de estudante": "N.º de estudiante",
  "Nome": "Nombre",
  "Curso": "Programa",
  "Ano": "Año",
  "Email": "Correo electrónico",
  "Senha": "Contraseña",
  "Introduza o seu email ou N.º de estudante": "Ingrese su correo o N.º de estudiante",
  "Introduza a sua senha": "Ingrese su contraseña",
  "Entrar no Portal do Estudante": "Ingresar al Portal del Estudiante",
  "Acesso de Teste Rápido (Demonstração)": "Acceso de Prueba Rápida (Demostración)",
  "Instruções para Recuperação de Senha": "Instrucciones de Recuperación de Contraseña",
  "Enviar Link de Recuperação": "Enviar Enlace de Recuperación",
  "Um email de redefinição de senha foi enviado para": "Un correo de restablecimiento fue enviado a",

  // fees & payments
  "Configuração dos encargos lectivos: propinas por semestre e taxas administrativas adicionais.":
    "Configuración de cargos académicos: colegiaturas por semestre y tasas administrativas.",
  "Propinas": "Colegiaturas",
  "Taxas": "Tasas",
  "registos": "registros",
  "Código": "Código",
  "Designação": "Descripción",
  "Abrangência": "Aplica a",
  "Valor": "Monto",
  "Estado dos Pagamentos": "Estado de Pagos",
  "Registo de todas as transacções, método de pagamento e saldo remanescente por encargo.":
    "Registro de cada transacción, método de pago y saldo restante por cargo.",
  "todos": "todos",
  "pago": "pagado",
  "pendente": "pendiente",
  "vencido": "vencido",
  "transacções": "transacciones",
  "Referência": "Referencia",
  "Data": "Fecha",
  "Método": "Método",
  "Pago": "Pagado",
  "Recibo": "Recibo",
  "Cartão": "Tarjeta bancaria",
  "Mobile Money": "Pago Móvil",
  "Transferência Bancária": "Transferencia Bancaria",
  "Disparar Lembrete SMS / M-Pesa": "Recordatorio SMS / M-Pesa",
  "Configurar M-Pesa & Cartões Moçambique": "Configurar M-Pesa y Tarjetas",
  "Pagar Factura": "Pagar Factura",
  "Simular Taxas": "Calcular Tasas",
  "Solicitar Bolsa": "Solicitar Beca",
  "Cartão de Estudante": "Tarjeta de Estudiante",
  "Emitir Recibo": "Emitir Recibo",

  // receipts & docs
  "Comprovativos emitidos automaticamente após a liquidação de uma propina ou taxa.":
    "Comprobantes emitidos automáticamente tras la liquidación del cargo.",
  "recibos emitidos": "recibos emitidos",
  "Descarregar PDF": "Descargar PDF",

  // courses
  "Engenharia Informática": "Ingeniería Informática",
  "Gestão de Empresas": "Gestión de Empresas",
  "Direito": "Derecho",
  "Medicina": "Medicina",
  "Arquitectura": "Arquitectura",
  "Todos": "Todos",

  // fee designations
  "Propina · 1º Semestre": "Colegiatura · 1.er Semestre",
  "Propina · 2º Semestre": "Colegiatura · 2.º Semestre",
  "Propina Clínica (acréscimo)": "Colegiatura clínica (suplemento)",
  "Taxa de Inscrição Anual": "Tasa de inscripción anual",
  "Taxa de Biblioteca": "Tasa de biblioteca",
  "Taxa de Laboratório": "Tasa de laboratorio",
  "Taxa de Certificação de Documentos": "Tasa de certificación de documentos",
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (pt: string) => string;
};

const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (s) => s });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("ul-lang") as Lang | null;
    if (saved === "en" || saved === "pt" || saved === "fr" || saved === "es") {
      setLangState(saved);
    } else {
      setLangState("en");
      window.localStorage.setItem("ul-lang", "en");
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        window.localStorage.setItem("ul-lang", l);
      },
      t: (pt) => {
        if (!pt) return "";
        const cleanPt = pt.trim();
        if (lang === "en") return EN[cleanPt] || EN[pt] || pt;
        if (lang === "fr") return FR[cleanPt] || FR[pt] || pt;
        if (lang === "es") return ES[cleanPt] || ES[pt] || pt;
        return pt;
      },
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  return useContext(LangContext);
}
