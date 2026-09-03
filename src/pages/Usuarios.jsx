import React, { useState, useEffect, useMemo } from 'react';
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
  Lock,
  ChevronRight,
  Crown,
  Trash2,
  Edit3,
  RefreshCw,
  Copy,
  Check,
  Search,
  Filter,
  X,
  UserCheck,
  UserX,
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
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth as mainAuth, db, firebaseConfig } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDateBR } from '../utils/formatters';

/**
 * Tela de Gestão de Usuários e Equipe (src/pages/Usuarios.jsx)
 * 
 * - Otimizada para PWA e dispositivos móveis (Tailwind CSS)
 * - Acessível exclusivamente para perfis 'criador' e 'dono'
 * - Cadastro com Firebase Auth sem deslogar o usuário atual
 * - Documento salvo na coleção 'users' com { name, email, role, createdAt }
 * - Listagem em tempo real (onSnapshot) com badges coloridas
 * - Edição de perfil/role e exclusão/desativação no Firestore
 */
export const Usuarios = ({ onNavigateTab }) => {
  const { user: currentUser, role: currentRole } = useAuth();

  // Estados do Formulário de Cadastro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('administrador'); // 'criador' | 'dono' | 'administrador'
  const [showPassword, setShowPassword] = useState(false);

  // Estados de submissão e feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Lista de Usuários do Firestore
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Filtros de busca e listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos'); // 'todos' | 'criador' | 'dono' | 'administrador'

  // Estados de Edição de Perfil/Role
  const [editingUser, setEditingUser] = useState(null);
  const [newEditRole, setNewEditRole] = useState('administrador');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessFeedback, setEditSuccessFeedback] = useState(null);

  // Estados de Exclusão / Desativação
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificação Estrita de Permissão
  const isAuthorized = currentRole === 'criador' || currentRole === 'dono';

  // Listener em tempo real da coleção 'users' do Firestore
  useEffect(() => {
    if (!isAuthorized) return;

    setLoadingUsers(true);
    const usersRef = collection(db, 'users');

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const users = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Ocultar o usuário criador de todas as listagens nas telas
          if (data.role === 'criador') return;

          users.push({
            id: docSnap.id,
            uid: docSnap.id,
            ...data,
          });
        });

        // Ordenação inteligente: Donos > Administradores > Nome
        users.sort((a, b) => {
          const roleWeight = { criador: 3, dono: 2, administrador: 1 };
          const weightA = roleWeight[a.role] || 0;
          const weightB = roleWeight[b.role] || 0;
          if (weightB !== weightA) return weightB - weightA;
          return (a.name || a.displayName || '').localeCompare(b.name || b.displayName || '');
        });

        setUsersList(users);
        setLoadingUsers(false);
      },
      (error) => {
        console.error('Erro ao escutar usuários do Firestore:', error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  // Handler de Cadastro de Novo Usuário
  const handleCadastrarNovoUsuario = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName) {
      setErrorMessage('Por favor, informe o Nome Completo do colaborador.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setErrorMessage('A Senha Inicial deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!['criador', 'dono', 'administrador'].includes(selectedRole)) {
      setErrorMessage('Selecione um Nível de Acesso válido.');
      return;
    }

    setIsSubmitting(true);
    let secondaryApp = null;

    try {
      // 1. Instanciar aplicação secundária para NÃO deslogar a sessão atual
      const tempAppName = `userCreation_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      secondaryApp = initializeApp(firebaseConfig, tempAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Registrar no Firebase Authentication com e-mail e senha
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        cleanPassword
      );
      const createdUser = credential.user;

      // 3. Atualizar o displayName no Auth
      await updateProfile(createdUser, {
        displayName: cleanName,
      });

      // 4. Salvar documento na coleção 'users' com ID igual ao UID do usuário
      const userDocRef = doc(db, 'users', createdUser.uid);
      const userData = {
        uid: createdUser.uid,
        name: cleanName,
        displayName: cleanName,
        email: cleanEmail,
        role: selectedRole, // 'criador' | 'dono' | 'administrador'
        createdAt: new Date(),
        createdAtISO: new Date().toISOString(),
        status: 'ativo',
        createdByUid: currentUser?.uid || 'sistema',
        createdByEmail: currentUser?.email || 'sistema',
      };

      await setDoc(userDocRef, userData);

      // 5. Finalizar e desconectar instância secundária
      await signOut(secondaryAuth);
      try {
        await deleteApp(secondaryApp);
      } catch (e) {
        // Silencioso
      }
      secondaryApp = null;

      // 6. Feedback de Sucesso e Reset do Formulário
      setSuccessMessage({
        name: cleanName,
        email: cleanEmail,
        role: selectedRole,
      });

      setName('');
      setEmail('');
      setPassword('');
      setSelectedRole('administrador');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 7000);
    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
      let friendlyText = 'Erro ao criar conta no Firebase. Tente novamente.';

      if (err?.code === 'auth/email-already-in-use') {
        friendlyText = `O e-mail "${cleanEmail}" já está cadastrado no sistema. Escolha outro e-mail.`;
      } else if (err?.code === 'auth/weak-password') {
        friendlyText = 'A senha informada é fraca. Digite pelo menos 6 caracteres alfanuméricos.';
      } else if (err?.code === 'auth/invalid-email') {
        friendlyText = 'O formato do e-mail é inválido.';
      } else if (err?.message) {
        friendlyText = `Erro no Firebase: ${err.message}`;
      }

      setErrorMessage(friendlyText);
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          // Silencioso
        }
      }
      setIsSubmitting(false);
    }
  };

  // Handler para Salvar Edição de Perfil/Role de um Usuário
  const handleSaveEditRole = async () => {
    if (!editingUser) return;
    setIsSavingEdit(true);
    setEditSuccessFeedback(null);

    try {
      const userRef = doc(db, 'users', editingUser.id || editingUser.uid);
      await updateDoc(userRef, {
        role: newEditRole,
        updatedAt: new Date(),
        updatedBy: currentUser?.email || 'administrador',
      });

      setEditSuccessFeedback(`Perfil de ${editingUser.name || editingUser.email} atualizado para "${newEditRole}".`);
      setTimeout(() => {
        setEditSuccessFeedback(null);
        setEditingUser(null);
      }, 2000);
    } catch (err) {
      console.error('Erro ao atualizar papel do usuário:', err);
      alert('Não foi possível atualizar o perfil no Firestore. Verifique suas permissões.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handler para Excluir ou Desativar Usuário
  const handleConfirmDelete = async (actionType = 'excluir') => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      const userRef = doc(db, 'users', userToDelete.id || userToDelete.uid);
      if (actionType === 'desativar') {
        await updateDoc(userRef, {
          status: 'inativo',
          deactivatedAt: new Date(),
          deactivatedBy: currentUser?.email,
        });
      } else {
        await deleteDoc(userRef);
      }
      setUserToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir/desativar usuário:', err);
      alert('Erro ao realizar a operação no Firestore.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copiar e-mail para a área de transferência
  const handleCopyEmail = (emailStr) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emailStr);
      setCopiedEmail(emailStr);
      setTimeout(() => setCopiedEmail(null), 2500);
    }
  };

  // Filtragem da Lista
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Ocultar qualquer usuário criador das telas
      if (u.role === 'criador') return false;

      const matchesSearch =
        !searchTerm ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'todos' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [usersList, searchTerm, roleFilter]);

  // Renderizador de Badge por Role
  const renderRoleBadge = (roleStr) => {
    switch (roleStr) {
      case 'criador':
      case 'dono':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Dono</span>
          </span>
        );
      case 'administrador':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Administrador</span>
          </span>
        );
    }
  };

  // Formatação de data amigável
  const formatUserCreationDate = (u) => {
    if (u.createdAtISO) {
      return formatDateBR(u.createdAtISO.split('T')[0]);
    }
    if (u.createdAt?.toDate) {
      try {
        const d = u.createdAt.toDate();
        return d.toLocaleDateString('pt-BR');
      } catch (e) {
        // fallback
      }
    }
    if (u.createdAt instanceof Date) {
      return u.createdAt.toLocaleDateString('pt-BR');
    }
    return 'Recente';
  };

  // =========================================================================
  // Bloqueio de Acesso para perfis não autorizados (ex: 'administrador')
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 animate-in fade-in">
        <div className="bg-zinc-900/95 border border-rose-800/60 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-block">
              Acesso Restrito
            </span>
            <h2 className="text-xl font-black text-zinc-100">Gestão de Usuários</h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Esta seção e o gerenciamento de credenciais do Firebase são exclusivos para o perfil{' '}
              <strong className="text-amber-300">Dono</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800 text-left text-xs text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-300">
              Seu perfil atual: <span className="uppercase text-amber-400 font-black">{currentRole === 'criador' ? 'DONO' : currentRole}</span>
            </p>
            <p className="text-[11px] text-zinc-500">
              Como Administrador, você possui permissão total para gerenciar Estoque, Bandas e a Escala de Trabalho.
            </p>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('estoque')}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              Voltar ao Estoque
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="usuarios-management-page" className="space-y-6 pb-12 max-w-6xl mx-auto px-1 sm:px-2">
      {/* ===================================================================== */}
      {/* CABEÇALHO DO MÓDULO */}
      {/* ===================================================================== */}
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-zinc-100 tracking-tight">
                  Gestão de Usuários e Equipe
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-amber-500/20 text-amber-300 border-amber-500/40">
                  ⭐ Dono
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700">
                  Firebase Auth & Firestore
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cadastre colaboradores, atribua níveis de acesso (RBAC) e sincronize os perfis em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-right">
              <span className="text-[10px] text-zinc-500 block">Total Ativo</span>
              <span className="text-xs font-black text-amber-400">
                {usersList.length} Usuário{usersList.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MENSAGENS DE FEEDBACK */}
      {/* ===================================================================== */}
      {successMessage && (
        <div
          id="usuarios-alert-success"
          className="p-4 bg-emerald-950/70 border border-emerald-600/80 rounded-2xl flex items-start gap-3 shadow-lg shadow-emerald-950/30 animate-in fade-in slide-in-from-top-2"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-emerald-200 text-sm">
              Colaborador cadastrado com sucesso no Firebase!
            </p>
            <p className="text-emerald-300/90">
              <strong>{successMessage.name}</strong> foi registrado(a) com e-mail <code>{successMessage.email}</code> no nível <strong>{successMessage.role.toUpperCase()}</strong>.
            </p>
            <p className="text-[11px] text-emerald-400/80">
              O documento foi salvo na coleção <code>users</code> e o login já está disponível.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          id="usuarios-alert-error"
          className="p-4 bg-rose-950/70 border border-rose-700 rounded-2xl flex items-start gap-3 shadow-lg shadow-rose-950/30 animate-in fade-in slide-in-from-top-2"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-rose-200">Não foi possível realizar o cadastro</p>
            <p className="text-rose-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* GRID: FORMULÁRIO DE CADASTRO + GUIA DE NÍVEIS DE ACESSO */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 📝 FORMULÁRIO DE CADASTRO */}
        <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Colaborador</span>
            </div>
            <span className="text-[11px] text-zinc-500">Sem deslogar o operador</span>
          </div>

          <form onSubmit={handleCadastrarNovoUsuario} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Nome Completo (name) */}
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                  1. Nome Completo <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-usuario-name"
                    type="text"
                    required
                    placeholder="Ex: Amanda Ferreira da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* 2. E-mail (email) */}
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                  2. E-mail <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-usuario-email"
                    type="email"
                    required
                    placeholder="Ex: amanda@bardatenda.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 3. Senha Inicial (password) */}
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                  3. Senha Inicial <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-usuario-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  Mínimo de 6 dígitos exigido pelo Firebase.
                </span>
              </div>

              {/* 4. Nível de Acesso (role) - Dropdown Select */}
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                  4. Nível de Acesso (Perfil / Role) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-usuario-role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
                  >
                    <option value="administrador">🛡️ Administrador (Estoque, Bandas & Equipe)</option>
                    <option value="dono">⭐ Dono (Acesso Total + Caixa e Contas)</option>
                  </select>
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Define quais telas e recursos o usuário pode operar.
                </span>
              </div>
            </div>

            {/* Botão de Envio */}
            <div className="pt-2">
              <button
                id="btn-submit-cadastrar-usuario"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-zinc-950 font-black rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Salvando usuário no Firebase Auth & Firestore...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Usuário no Firebase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 🛡️ GUIA DE NÍVEIS DE ACESSO */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-zinc-200 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Níveis de Acesso (Roles)</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Dono */}
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-black text-[11px]">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>⭐ Dono</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Acesso a todos os módulos financeiros (Caixa, Contas a Pagar/Receber), Estoque, Bandas e Usuários.
              </p>
            </div>

            {/* Administrador */}
            <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-blue-300 font-black text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>🛡️ Administrador</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Operação do bar: Estoque, Banda e Escala de Turnos.<br />
                <span className="text-rose-400 font-semibold">Bloqueado:</span> Não tem acesso a Caixa e Contas.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[10px] text-zinc-500 leading-relaxed">
            💡 <strong>Segurança PWA:</strong> O usuário é criado isoladamente sem derrubar o login atual de quem opera o sistema.
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* LISTA & TABELA DE USUÁRIOS CADASTRADOS (EM TEMPO REAL) */}
      {/* ===================================================================== */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Cabeçalho da Tabela & Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <h3 className="text-sm sm:text-base font-black text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Colaboradores Cadastrados no Sistema</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Coleção <code>users</code> sincronizada em tempo real via Firestore <code>onSnapshot</code>.
            </p>
          </div>

          {/* Barra de Busca e Filtro de Role */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Campo de Busca */}
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filtro por Role */}
            <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              {['todos', 'dono', 'administrador'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold capitalize transition-all ${
                    roleFilter === r
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback de Edição */}
        {editSuccessFeedback && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{editSuccessFeedback}</span>
          </div>
        )}

        {/* Estado de Carregamento */}
        {loadingUsers ? (
          <div className="py-12 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Carregando usuários cadastrados no Firestore...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <UserX className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-bold">Nenhum colaborador encontrado.</p>
            <p className="text-[11px] text-zinc-500">
              {searchTerm || roleFilter !== 'todos'
                ? 'Tente ajustar os termos de pesquisa ou o filtro de perfil.'
                : 'Cadastre o primeiro colaborador preenchendo o formulário acima.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visualização em Tabela no Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-3">Colaborador</th>
                    <th className="py-3 px-3">E-mail</th>
                    <th className="py-3 px-3">Nível de Acesso</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Cadastro</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredUsers.map((u) => {
                    const isSelf = u.email === currentUser?.email;
                    const isCreator = u.role === 'criador';
                    const isInactive = u.status === 'inativo';

                    return (
                      <tr
                        key={u.id || u.uid}
                        className="hover:bg-zinc-950/40 transition-colors group"
                      >
                        {/* Nome / Avatar */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                                u.role === 'criador'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : u.role === 'dono'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              }`}
                            >
                              {(u.name || u.displayName || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-100 truncate">
                                {u.name || u.displayName || 'Sem Nome'}
                              </p>
                              {isSelf && (
                                <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-wide">
                                  (Você)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* E-mail */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <span className="font-mono text-[11px] truncate max-w-[200px]">
                              {u.email}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(u.email)}
                              title="Copiar e-mail"
                              className="p-1 text-zinc-500 hover:text-amber-400 transition-colors"
                            >
                              {copiedEmail === u.email ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Role / Badge */}
                        <td className="py-3 px-3">
                          {renderRoleBadge(u.role)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isInactive
                                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isInactive ? 'bg-zinc-500' : 'bg-emerald-400'
                              }`}
                            />
                            {isInactive ? 'Inativo' : 'Ativo'}
                          </span>
                        </td>

                        {/* Data */}
                        <td className="py-3 px-3 text-zinc-500 text-[11px]">
                          {formatUserCreationDate(u)}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Editar Perfil */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(u);
                                setNewEditRole(u.role || 'administrador');
                              }}
                              title="Editar Perfil / Role"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir/Desativar */}
                            {!isCreator && !isSelf && (
                              <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                title="Excluir ou desativar usuário"
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visualização em Cards no Mobile (PWA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-3">
              {filteredUsers.map((u) => {
                const isSelf = u.email === currentUser?.email;
                const isCreator = u.role === 'criador';
                const isInactive = u.status === 'inativo';

                return (
                  <div
                    key={u.id || u.uid}
                    className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                            u.role === 'criador'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : u.role === 'dono'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {(u.name || u.displayName || u.email || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs text-zinc-100 truncate">
                            {u.name || u.displayName || 'Sem Nome'}
                          </h4>
                          <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                            <span>{u.email}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyEmail(u.email)}
                        className="p-1 text-zinc-400 hover:text-amber-400"
                        title="Copiar e-mail"
                      >
                        {copiedEmail === u.email ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                      <div>{renderRoleBadge(u.role)}</div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setNewEditRole(u.role || 'administrador');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 hover:text-amber-400 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        {!isCreator && !isSelf && (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 text-[10px]"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: EDITAR PERFIL / ROLE */}
      {/* ===================================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Alterar Perfil de Acesso</span>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-zinc-400">
                Colaborador:{' '}
                <strong className="text-zinc-200">{editingUser.name || editingUser.email}</strong>
              </p>
              <p className="text-zinc-500 text-[11px]">{editingUser.email}</p>

              <div className="pt-2">
                <label className="block text-xs font-bold text-zinc-200 mb-1.5">
                  Novo Nível de Acesso (Role):
                </label>
                <select
                  value={newEditRole}
                  onChange={(e) => setNewEditRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="administrador">🛡️ Administrador (Operacional)</option>
                  <option value="dono">⭐ Dono (Acesso Total)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isSavingEdit}
                className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditRole}
                disabled={isSavingEdit}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Alteração</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CONFIRMAR EXCLUSÃO / DESATIVAÇÃO */}
      {/* ===================================================================== */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">Remover Colaborador?</h3>
              <p className="text-xs text-zinc-400">
                O colaborador <strong className="text-zinc-200">{userToDelete.name || userToDelete.email}</strong> será removido do Firestore.
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
                onClick={() => handleConfirmDelete('excluir')}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/30"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
