import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  Lock,
  ChevronRight,
  Crown,
  Trash2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth as mainAuth, db, firebaseConfig } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { StaffModule } from '../components/staff/StaffModule';
import { formatDateBR } from '../utils/formatters';

/**
 * Tela de Gestão de Equipe (src/pages/Equipe.jsx)
 * Acessível exclusivamente para os perfis 'criador' e 'dono'.
 * Permite cadastrar novos colaboradores no Firebase Auth e salvar
 * o documento na coleção 'users' do Firestore com o perfil (role) selecionado.
 */
export const Equipe = ({
  shifts = [],
  staffMembers = [],
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onDeleteMultipleShifts,
  onBatchAddShifts,
  onAddStaffMember,
  onUpdateStaffMember,
  onDeleteStaffMember,
  onDeleteMultipleStaffMembers,
  onNavigateTab,
}) => {
  const { user: currentUser, role: currentRole } = useAuth();

  // Controle de Abas Internas: 'usuarios' (Cadastro/Acessos) ou 'escala' (Turnos e Plantões do Bar)
  const [activeSubTab, setActiveSubTab] = useState('usuarios');

  // Estado do Formulário de Cadastro de Colaborador
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState('administrador'); // 'dono' | 'administrador'
  const [showPassword, setShowPassword] = useState(false);

  // Estados de feedback e submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Lista de Usuários do Sistema sincronizada em tempo real do Firestore
  const [systemUsers, setSystemUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Confirmação de exclusão
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validação de Permissão Estrita: Apenas 'criador' e 'dono'
  const isAuthorized = currentRole === 'criador' || currentRole === 'dono';

  // Listener em tempo real da coleção 'users' no Firestore
  useEffect(() => {
    if (!isAuthorized) return;

    setLoadingUsers(true);
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const usersList = [];
        snapshot.forEach((docSnap) => {
          usersList.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });

        // Ordenação: criadores primeiro, depois donos, depois administradores, ordenados por data ou nome
        usersList.sort((a, b) => {
          const roleWeight = { criador: 3, dono: 2, administrador: 1 };
          const weightA = roleWeight[a.role] || 0;
          const weightB = roleWeight[b.role] || 0;
          if (weightB !== weightA) return weightB - weightA;
          return (a.name || '').localeCompare(b.name || '');
        });

        setSystemUsers(usersList);
        setLoadingUsers(false);
      },
      (error) => {
        console.error('Erro ao escutar coleção users do Firestore:', error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  // Handler de Cadastro de Novo Colaborador
  const handleCadastrarColaborador = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validações locais
    const cleanNome = nome.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSenha = senha.trim();

    if (!cleanNome) {
      setErrorMessage('Por favor, informe o Nome Completo do colaborador.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!cleanSenha || cleanSenha.length < 6) {
      setErrorMessage('A Senha Inicial deve ter no mínimo 6 caracteres.');
      return;
    }

    if (perfil !== 'dono' && perfil !== 'administrador') {
      setErrorMessage('Selecione um Perfil de Acesso válido (Dono ou Administrador).');
      return;
    }

    setIsSubmitting(true);

    let secondaryApp = null;
    try {
      // 1. Instanciar aplicativo secundário do Firebase Auth para NÃO deslogar a sessão atual do criador/dono
      const tempAppName = `teamUserCreation_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      secondaryApp = initializeApp(firebaseConfig, tempAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Criar o usuário no Firebase Authentication com e-mail e senha
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        cleanSenha
      );
      const newFirebaseUser = userCredential.user;

      // 3. Atualizar o displayName do novo usuário
      if (cleanNome) {
        await updateProfile(newFirebaseUser, {
          displayName: cleanNome,
        });
      }

      // 4. Salvar o documento na coleção 'users' do Firestore com o perfil (role) selecionado
      const userDocRef = doc(db, 'users', newFirebaseUser.uid);
      const userData = {
        uid: newFirebaseUser.uid,
        name: cleanNome,
        displayName: cleanNome,
        email: cleanEmail,
        role: perfil, // 'dono' | 'administrador'
        status: 'ativo',
        createdAt: serverTimestamp(),
        createdAtISO: new Date().toISOString(),
        createdByUid: currentUser?.uid || 'desconhecido',
        createdByEmail: currentUser?.email || 'desconhecido',
        createdByName: currentUser?.name || 'Administrador',
      };

      await setDoc(userDocRef, userData);

      // 5. Deslogar e descartar a instância secundária do Firebase
      await signOut(secondaryAuth);
      try {
        await deleteApp(secondaryApp);
      } catch (e) {
        // Sem impacto caso já tenha sido finalizado
      }
      secondaryApp = null;

      // 6. Feedback de sucesso e limpeza do formulário
      setSuccessMessage({
        nome: cleanNome,
        email: cleanEmail,
        perfil: perfil === 'dono' ? 'Dono (Acesso Total)' : 'Administrador (Operações)',
      });

      setNome('');
      setEmail('');
      setSenha('');
      setPerfil('administrador');

      // Limpar mensagem de sucesso após 6 segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
    } catch (error) {
      console.error('Erro ao cadastrar novo colaborador no Firebase:', error);
      let friendlyError = 'Ocorreu um erro ao criar o colaborador no Firebase. Tente novamente.';

      if (error?.code === 'auth/email-already-in-use') {
        friendlyError = `O e-mail "${cleanEmail}" já está cadastrado no sistema. Escolha outro e-mail ou redefina a senha deste usuário.`;
      } else if (error?.code === 'auth/weak-password') {
        friendlyError = 'A senha informada é fraca. Crie uma senha com pelo menos 6 caracteres alfanuméricos.';
      } else if (error?.code === 'auth/invalid-email') {
        friendlyError = 'O e-mail informado possui um formato inválido.';
      } else if (error?.message) {
        friendlyError = `Erro no Firebase: ${error.message}`;
      }

      setErrorMessage(friendlyError);
    } finally {
      // Garantir limpeza caso ocorra falha no processo
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          // Ignore
        }
      }
      setIsSubmitting(false);
    }
  };

  // Excluir usuário do Firestore
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id || userToDelete.uid));
      setUserToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyEmail = (emailStr) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailStr);
      setCopiedEmail(emailStr);
      setTimeout(() => setCopiedEmail(null), 2500);
    }
  };

  // =========================================================================
  // Bloqueio de Acesso para perfis não autorizados (ex: 'administrador')
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="max-w-lg mx-auto my-12 px-4">
        <div className="bg-zinc-900/90 border border-rose-800/60 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-block">
              Área Exclusiva
            </span>
            <h2 className="text-xl font-black text-zinc-100">Acesso Restrito à Gestão de Equipe</h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              A tela de cadastro de novos colaboradores e atribuição de perfis de acesso é exclusiva para os perfis{' '}
              <strong className="text-purple-300">Criador</strong> e <strong className="text-amber-300">Dono</strong>.
            </p>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-left text-xs text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-300">Seu perfil atual: <span className="uppercase text-amber-400">{currentRole}</span></p>
            <p className="text-[11px] text-zinc-500">
              Você pode acessar os módulos operacionais de <strong>Banda</strong>, <strong>Estoque</strong> e <strong>Escala de Turnos</strong>.
            </p>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('estoque')}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              Ir para o Módulo de Estoque
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="equipe-management-page" className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* ===================================================================== */}
      {/* CABEÇALHO DO MÓDULO */}
      {/* ===================================================================== */}
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-zinc-100 tracking-tight">
                  Gestão de Equipe & Acessos
                </h1>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                    currentRole === 'criador'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {currentRole === 'criador' ? '👑 Criador' : '⭐ Dono'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cadastre novos colaboradores com acesso ao sistema e gerencie permissões de Dono e Administrador.
              </p>
            </div>
          </div>

          {/* Seletor de Sub-Abas: Usuários do Sistema vs Escala de Plantões */}
          <div className="flex items-center p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80 self-start sm:self-auto">
            <button
              id="subtab-users"
              onClick={() => setActiveSubTab('usuarios')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'usuarios'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Usuários & Acessos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeSubTab === 'usuarios'
                    ? 'bg-zinc-950/30 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {systemUsers.length}
              </span>
            </button>

            <button
              id="subtab-escala"
              onClick={() => setActiveSubTab('escala')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'escala'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Escala de Plantões</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeSubTab === 'escala'
                    ? 'bg-zinc-950/30 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {staffMembers.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CONTEÚDO DA SUB-ABA: ESCALA OPERACIONAL DO BAR */}
      {/* ===================================================================== */}
      {activeSubTab === 'escala' && (
        <StaffModule
          shifts={shifts}
          staffMembers={staffMembers}
          onAddShift={onAddShift}
          onUpdateShift={onUpdateShift}
          onDeleteShift={onDeleteShift}
          onDeleteMultipleShifts={onDeleteMultipleShifts}
          onBatchAddShifts={onBatchAddShifts}
          onAddStaffMember={onAddStaffMember}
          onUpdateStaffMember={onUpdateStaffMember}
          onDeleteStaffMember={onDeleteStaffMember}
          onDeleteMultipleStaffMembers={onDeleteMultipleStaffMembers}
        />
      )}

      {/* ===================================================================== */}
      {/* CONTEÚDO DA SUB-ABA: CADASTRO DE COLABORADORES & USUÁRIOS DO SISTEMA */}
      {/* ===================================================================== */}
      {activeSubTab === 'usuarios' && (
        <div className="space-y-6">
          {/* Alerta de Sucesso */}
          {successMessage && (
            <div
              id="alert-user-success"
              className="p-4 bg-emerald-950/60 border border-emerald-600/80 rounded-2xl flex items-start gap-3 shadow-lg shadow-emerald-950/30 animate-in fade-in"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-emerald-200 text-sm">
                  Colaborador cadastrado com sucesso no Firebase!
                </p>
                <p className="text-emerald-300/90">
                  <strong>{successMessage.nome}</strong> foi registrado(a) com e-mail <code>{successMessage.email}</code> no perfil <strong>{successMessage.perfil}</strong>.
                </p>
                <p className="text-[11px] text-emerald-400/80">
                  O colaborador já pode fazer login no aplicativo com o e-mail e a senha inicial cadastrada.
                </p>
              </div>
            </div>
          )}

          {/* Alerta de Erro */}
          {errorMessage && (
            <div
              id="alert-user-error"
              className="p-4 bg-rose-950/60 border border-rose-700 rounded-2xl flex items-start gap-3 shadow-lg shadow-rose-950/30 animate-in fade-in"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-rose-200">Atenção ao cadastrar colaborador</p>
                <p className="text-rose-300/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Grid Principal: Formulário à esquerda + Resumo das Regras à direita */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 📝 FORMULÁRIO DE CADASTRO */}
            <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
              <div className="border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Novo Colaborador</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Preencha os dados abaixo para gerar a credencial de acesso do novo integrante da equipe.
                </p>
              </div>

              <form onSubmit={handleCadastrarColaborador} className="space-y-4">
                {/* 1. Nome Completo */}
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                    1. Nome Completo <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="input-colaborador-nome"
                      type="text"
                      required
                      placeholder="Ex: Carlos Alberto de Souza"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                {/* 2. E-mail */}
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                    2. E-mail de Acesso <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="input-colaborador-email"
                      type="email"
                      required
                      placeholder="Ex: carlos@bardatenda.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    Será o identificador oficial para fazer login no sistema.
                  </span>
                </div>

                {/* 3. Senha Inicial */}
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                    3. Senha Inicial <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="input-colaborador-senha"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres (Ex: bar1234)"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    O colaborador poderá alterar essa senha posteriormente no próprio perfil.
                  </span>
                </div>

                {/* 4. Perfil de Acesso (Seletor entre 'Dono' e 'Administrador') */}
                <div>
                  <label className="block text-xs font-bold text-zinc-200 mb-2">
                    4. Perfil de Acesso <span className="text-rose-400">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opção Dono */}
                    <label
                      htmlFor="radio-perfil-dono"
                      className={`relative flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        perfil === 'dono'
                          ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500 shadow-md'
                          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black text-amber-300">Dono</span>
                        </div>
                        <input
                          type="radio"
                          id="radio-perfil-dono"
                          name="perfilAcesso"
                          value="dono"
                          checked={perfil === 'dono'}
                          onChange={() => setPerfil('dono')}
                          className="accent-amber-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-300 font-medium">
                        Acesso total irrestrito
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                        Visualiza e edita Caixa Financeiro, Contas a Pagar/Receber, Estoque, Bandas e Equipe.
                      </p>
                    </label>

                    {/* Opção Administrador */}
                    <label
                      htmlFor="radio-perfil-admin"
                      className={`relative flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        perfil === 'administrador'
                          ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500 shadow-md'
                          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-black text-blue-300">Administrador</span>
                        </div>
                        <input
                          type="radio"
                          id="radio-perfil-admin"
                          name="perfilAcesso"
                          value="administrador"
                          checked={perfil === 'administrador'}
                          onChange={() => setPerfil('administrador')}
                          className="accent-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-300 font-medium">
                        Operações do Bar (Restrito)
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                        Acesso exclusivo a Estoque, Banda e Escala de Turnos. Bloqueado de ver Caixa e Contas.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Botão de Envio */}
                <div className="pt-2">
                  <button
                    id="btn-cadastrar-colaborador"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-zinc-950 font-black rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Criando usuário no Firebase...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Cadastrar Colaborador no Firebase</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 🛡️ GUIA DE PERMISSÕES & POLÍTICA DE SEGURANÇA */}
            <div className="space-y-4">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-zinc-200 uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Matriz de Permissões (RBAC)</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                      <Crown className="w-3.5 h-3.5" />
                      <span>👑 Criador (Acesso Supremo)</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Acesso integral ao sistema, banco de dados, relatórios e gestão de usuários.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <Crown className="w-3.5 h-3.5" />
                      <span>⭐ Dono (Acesso Completo)</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Acesso a todos os módulos: Fluxo de Caixa, Contas a Pagar/Receber, Estoque, Bandas e Equipe.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>🛡️ Administrador (Operacional)</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Acesso liberado: <strong>Banda</strong>, <strong>Estoque</strong> e <strong>Equipe</strong>.<br />
                      <span className="text-rose-400 font-semibold">Bloqueado estrito:</span> Não vê nem acessa Contas e Caixa.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-500 leading-relaxed">
                  💡 Os dados são salvos em tempo real no Firebase Authentication e na coleção <code>users</code> do Firestore.
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* LISTA DE COLABORADORES CADASTRADOS NO FIRESTORE */}
          {/* ================================================================= */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Colaboradores Cadastrados no Sistema</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Usuários com login ativo sincronizados da coleção <code>users</code> do Firestore.
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-medium">
                Total: <strong className="text-amber-400">{systemUsers.length}</strong> usuários
              </span>
            </div>

            {loadingUsers ? (
              <div className="py-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Carregando usuários do Firebase...</span>
              </div>
            ) : systemUsers.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">Nenhum usuário cadastrado na coleção ainda.</p>
                <p className="text-[11px] text-zinc-500">
                  Preencha o formulário acima para criar o primeiro colaborador.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemUsers.map((usr) => {
                  const role = usr.role || 'administrador';
                  const isUserCreator = role === 'criador';
                  const isUserDono = role === 'dono';

                  return (
                    <div
                      key={usr.id || usr.uid}
                      className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-4 flex flex-col justify-between transition-all space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                                isUserCreator
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : isUserDono
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              }`}
                            >
                              {(usr.name || usr.displayName || usr.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="truncate">
                              <h4 className="text-xs font-black text-zinc-100 truncate">
                                {usr.name || usr.displayName || 'Sem Nome'}
                              </h4>
                              <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span className="truncate">{usr.email}</span>
                              </p>
                            </div>
                          </div>

                          {/* Botão Copiar E-mail */}
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(usr.email)}
                            title="Copiar e-mail"
                            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-900 transition-colors shrink-0"
                          >
                            {copiedEmail === usr.email ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Badges de Perfil e Acesso */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isUserCreator
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : isUserDono
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            {isUserCreator ? (
                              <>
                                <Crown className="w-3 h-3 text-purple-400" />
                                <span>Criador</span>
                              </>
                            ) : isUserDono ? (
                              <>
                                <Crown className="w-3 h-3 text-amber-400" />
                                <span>Dono</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3 text-blue-400" />
                                <span>Administrador</span>
                              </>
                            )}
                          </span>

                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                            {isUserCreator || isUserDono ? 'Acesso Total' : 'Operações do Bar'}
                          </span>
                        </div>
                      </div>

                      {/* Rodapé do Card */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>
                          {usr.createdAtISO
                            ? `Cadastrado em ${formatDateBR(usr.createdAtISO.split('T')[0])}`
                            : 'Registro Ativo'}
                        </span>

                        {/* Permitir exclusão apenas se não for criador e não for o usuário logado */}
                        {!isUserCreator && usr.email !== currentUser?.email && (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(usr)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                            title="Remover do Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">Remover Colaborador?</h3>
              <p className="text-xs text-zinc-400">
                Tem certeza que deseja remover o colaborador{' '}
                <strong className="text-zinc-200">{userToDelete.name || userToDelete.email}</strong> da base de dados do sistema?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/30"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipe;
