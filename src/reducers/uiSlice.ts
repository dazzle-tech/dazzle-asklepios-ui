import { uiService } from '@/services/uiService';
import { createSlice } from '@reduxjs/toolkit';
const savedLang = localStorage.getItem('lang') || 'en';

const initialState = {
  sev: 'info',
  msg: null,
  msgLife: 2000,
  lang: savedLang,
  mode: 'light',
  translations: {

    // pt: { // اللغة البرتغالية
    // "First Name" : "primeiro nome",
    // "Patient Registration" : "Cadastro de Paciente",
    // "Basic Information": "Informações Básicas",
    // "Demographics" : "Demografia",
    // "Extra Details" : "Detalhes extras",
    // "Insurance" : "Seguro",
    // "Privacy & Security" : "Privacidade e segurança",
    // "Consent Forms" : "Formulários de consentimento",
    // "Preferred Health Professional" : "Profissional de saúde preferido",
    // "Family Members" : "Membros da família",
    // "Secondary ID" : "ID secundário",
    // "Attachments" : "Anexos",
    // "Document" : "Documento",
    // "Contact" : "Contato",
    // "Address" : "Endereço",
    // "Second Name" : "Segundo nome",
    // "Third Name" : "Terceiro Nome",
    // "Last Name" : "Sobrenome",
    // "Sex at Birth" : "Sexo no nascimento",
    // "DOB" : "DN",
    // "Age" : "Idade",
    // "Patient Category" : "Categoria do Paciente",
    // "Patient Class" : "Classe de Paciente",
    // "Private Patient" : "Paciente Privado",
    // "First Name (Sec. Lang)" : "Primeiro nome (idioma secundário)",
    // "Second Name (Sec. Lang)" : "Segundo nome (L. Sec)",
    // "Third Name (Sec. Lang)" : "Terceiro Nome (L. Sec)",
    // "Last Name (Sec. Lang)" : "Sobrenome (L. Sec)",
    // "Primary Mobile Number" : "Número de celular principal",
    // "Receive SMS" : "Receber SMS",
    // "Secondary Mobile Number" : "Número de celular secundário",
    // "Work Phone" : "Telefone comercial",
    // "Receive Email" : "Receber e-mail",
    // "Preferred Way of Contact" : "Forma preferida de contato",
    // "Native Language" : "Língua materna",
    // "Emergency Contact Name" : "Nome do contato de emergência",
    // "Emergency Contact Relation" : "Relação de contato de emergência",
    // "Emergency Contact Phone" : "Telefone de contato de emergência",
    // "Role" : 'Papel',
    // "Document Type" : "Tipo de documento",
    // "Document Country" : "País do Documento",
    // "Document Number" : "Número do documento",
    // "Country" : "País",
    // "State/Province" : "Estado/Província",
    // "City" : "Cidade",
    // "Street Name" : "Nome da rua",
    // "House/Apartment Number" : "Número da casa/apartamento",
    // "Postal/ZIP code" : 'Código postal/CEP',
    // "Additional Address Line" : 'Linha de endereço adicional',
    // "Country ID" : "ID do país",
    // "Visit history" : "Histórico de visitas",
    // "Appointments" : "Compromissos",
    // "Address Change Log" : "Registro de alterações de endereço",
    // "Save" : 'Salvar',
    // "Scan Document": "Digitalizar documento",
    // "Clear" : "limpar",
    // "Quick Appointment": "Consulta rápida",
    // "Administrative Warnings" : "Avisos Administrativos",
    // "Marital Status" : 'Estado civil',
    // "Nationality" : "Nacionalidade",
    // "Religion" : "Religião",
    // "Ethnicity" : "Etnia",
    // "Occupation" : "Ocupação",
    // "Responsible Party" : "Parte Responsável",
    // "Educational Level" : "Nível Educacional",
    // "Previous ID" : "ID anterior",
    // "Archiving Number" : "Número de arquivamento",
    // "Details" : "Detalhes",
    // "New Insurance" : "Novo Seguro",
    // "Edit" : "Editar",
    // "Specific Coverage" : "Cobertura Específica",
    // "Delete" : "Excluir",
    // "Security Access Level" : "Nível de acesso de segurança",
    // "Patient Verification" : 'Verificação do Paciente',
    // "Privacy Authorization" : "Autorização de privacidade",
    // "New Preferred Health Professional" : "Novo Profissional de Saúde Preferencial",
    // "New Relative" : "Novo parente",
    // "New Secondary Document" : "Novo Documento Secundário",
    // "New Attachment" : "Novo anexo",
    // "Preview / Edit" : "Visualizar / Editar",
    // "key" : "chave",
    // "Date" : "Data",
    // "Department" : "Departamento",
    // "Encounter Type" : "Tipo de encontro",
    // "Physician" : "Médico",
    // "Priority" : "Prioridade",
    // "Appointment Date" : "Data da Consulta",
    // "Resource Type" : "Tipo de recurso",
    // "Resource" : "Recurso",
    // "Visit Type" : "Tipo de visita",
    // "Insurance Provider" : "Provedor de seguros",
    // "Insurance Policy Number" : "Número da apólice de seguro",
    // "Group Number" : 'Número do grupo',
    // "Insurance Plan Type" : "Tipo de plano de seguro",
    // "Expiration Date" : "Data de validade",
    // "Procedure Name" : "Nome do procedimento",
    // "Date and Time of Procedure" : "Data e hora do procedimento",
    // "Consent Status" : 'Status de consentimento',
    // "Sign Date and Time" : 'Data e hora de assinatura',
    // "Name of the HP" : "Nome da HP",
    // "Speciality" : "Especialidade",
    // 'Telephone no.' : "Nº de Telefone",
    // "HP Organization" : "Organização HP",
    // "Network Affiliation" : "Afiliação de rede",
    // "Related with" : 'Relacionado com',
    // "Relation Type" : "Tipo de relação",
    // "Relative Patient Name" : "Nome do paciente parente",
    // "Relation Category" : "Categoria de relação",
    // "CREATED AT/BY" : "CRIADO EM/POR",
    // "UPDATED AT/BY" : "ATUALIZADO EM/POR",
    // "Source" : 'Fonte',
    // "Attachment Name" : "Nome do anexo",
    // "File Type" : "Tipo de arquivo",
    // "Visit History" : "Histórico de visitas",
    // 'Approvals' : "Aprovações",
    // "View Price List" : "Ver lista de preços",
    // "Warnings Summary" : "Resumo de avisos",
    // "Bedside Registration" : "Registro de cabeceira",
    // "Bulk Registration" : "Registro em massa",
    // "Encounter Transactions" : "Transações de Encontro",
    // "Print Information" : "Imprimir informações",
    // "Print Patient Label" : "Imprimir etiqueta do paciente",
    // "Search Patient" : "Pesquisar paciente",
    // "Full Name" : "Nome completo",
    // "Primary Phone Number" : "Número de telefone principal",
    // "Date of Birth" : "Data de nascimento",
    // "Add" : "Adicionar",
    // "Type" : "Tipo",
    // "Description" : "Descrição",
    // "ADDITION BY/DATE" : "ADIÇÃO POR/DATA",
    // "RESOLVED BY/DATE" : "RESOLVIDO POR/DATA",
    // "RESOLUTION UNDO BY/DATE" : "RESOLUÇÃO DESFAÇÃO ATÉ/DATA",
    // "Warning Type" : "Tipo de aviso",
    // "Administrative Warning" : "Aviso Administrativo",
    // "Add New" : "Adicionar novo",
    // "Cancel" : "Cancelar",
    // "Encounter" : 'Encontro',
    // "Payment" : "Pagamento",
    // "Add Payment" : "Adicionar pagamento",
    // "Visit ID" : "ID da visita",
    // "Data" : "Dados",
    // "Resources" : "Recursos",
    // "Reason" : "Razão",
    // "Origin" : "Origem",
    // "Source Name" : "Nome da fonte",
    // "Sequence Daily Number" : "Número diário de sequência",
    // "Visit Sequence Number" : "Número de sequência de visita",
    // "Follow-up" : "Seguir",
    // "Note" : "Observação",
    // "Patient Balance" : "Saldo do Paciente",
    // "Fees" : "Tarifas",
    // "Payment Type" : "Tipo de pagamento",
    // "Payment Method" : "Método de pagamento",
    // "Back" : "Voltar",
    // "Amount" : "Quantia",
    // "Currency" : "Moeda",
    // "Add to Free Balance" : "Adicionar ao saldo grátis",
    // "Due Amount" : "Valor devido",
    // "Patient`s free Balance" : "Saldo livre do paciente",
    // "Refresh" : "Atualizar",
    // "Exchange Rate" : "Taxa de câmbio",
    // "Service Name" : "Nome do serviço",
    // "Quantity" : "Quantidade",
    // "Price" : "Preço",
    // "Next" : "Próximo",
    // "Add payment" : "Adicionar pagamento"
    // }

  },
  screenKey: '',
  loading: false,
  systemLoader: false,
  showChangePassword: false,
  showEditProfile: false
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setScreenKey: (state, action) => {
      state.screenKey = action.payload;
    },
    notify: (state, action) => {
      state.sev = action.payload.sev ? action.payload.sev : 'info';
      state.msg = action.payload.msg ? action.payload.msg : action.payload;
      state.msgLife = action.payload.life ? action.payload.life : 2000;
    },
    clearNotification: state => {
      state.sev = 'info';
      state.msg = null;
      state.msgLife = 2000;
    },
    showLoading: state => {
      state.loading = true;
    },
    hideLoading: state => {
      state.loading = false;
    },
    showSystemLoader: state => {
      state.systemLoader = true;
    },
    hideSystemLoader: state => {
      state.systemLoader = false;
    },
    openChangePassword: state => {
      state.showChangePassword = true;
    },
    closeChangePassword: state => {
      state.showChangePassword = false;
    },
    openEditProfile: state => {
      state.showEditProfile = true;
    },
    closeEditProfile: state => {
      state.showEditProfile = false;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setLang: (state, action) => {
      state.lang = action.payload;
      localStorage.setItem('lang', action.payload);
    },
    setTranslations: (state, action) => {
      state.translations = action.payload;
    },
  },
  extraReducers: builder => {
    /* changeLang */
    builder.addMatcher(
      uiService.endpoints.changeLang.matchFulfilled,
      (state, action) => {
        state.lang = action.payload.lang;
        state.translations = action.payload.translations;
      }
    );
  }
});
export const { setMode, setLang, setTranslations } = uiSlice.actions;
export default uiSlice;
