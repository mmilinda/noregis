import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Search, Mail, Lock, User, Phone, Building2, Briefcase, RefreshCw, Power, CheckCircle2, UserX } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, FormInput, FormSelect, Modal } from '../../components/UI';
import { authService } from '../../services/authService';
import { entrepriseService } from '../../services/entrepriseService';
import { TRANSLATIONS } from '../../translations';

const EMPTY_ACCOUNT = {
  email: '',
  password: '',
  prenom: '',
  nom: '',
  role: 'ADMIN',
  entrepriseId: '',
  entrepriseNom: '',
  telephone: '',
  departement: '',
  poste: '',
};

export default function ComptesManagement({ isMobile }) {
  const { state, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const [users, setUsers] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [entrepriseFilter, setEntrepriseFilter] = useState('ALL');
  const [statutFilter, setStatutFilter] = useState('ALL');

  // Modal création
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_ACCOUNT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchUsersAndEntreprises = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [usrData, entData] = await Promise.all([
        authService.getAllUsers(),
        entrepriseService.getAll(),
      ]);
      setUsers(usrData?.utilisateurs || (Array.isArray(usrData) ? usrData : []));
      setEntreprises(Array.isArray(entData) ? entData : (entData?.entreprises || []));
    } catch (err) {
      notify('error', 'Erreur lors de la récupération des données.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchUsersAndEntreprises();
  }, [fetchUsersAndEntreprises]);

  const handleEntrepriseChange = (entId) => {
    const ent = entreprises.find(e => (e.id === entId || e._id === entId));
    setCreateForm(f => ({
      ...f,
      entrepriseId: entId,
      entrepriseNom: ent ? ent.nom : '',
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.email.trim() || !createForm.password.trim() || !createForm.prenom.trim() || !createForm.nom.trim()) {
      setCreateError('Veuillez remplir les champs obligatoires (Email, Mot de passe, Prénom, Nom).');
      return;
    }

    if (createForm.role !== 'SUPERADMIN' && !createForm.entrepriseId) {
      setCreateError('Veuillez sélectionner l\'entreprise pour cet utilisateur.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      await authService.createUser(createForm);
      notify('success', `Compte ${createForm.role} créé avec succès pour ${createForm.prenom} ${createForm.nom}.`);
      setCreateForm(EMPTY_ACCOUNT);
      setCreateOpen(false);
      fetchUsersAndEntreprises(true);
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id, targetStatus) => {
    try {
      await authService.updateUserStatus(id, targetStatus);
      notify('success', `Statut du compte mis à jour vers "${targetStatus}".`);
      fetchUsersAndEntreprises(true);
    } catch (err) {
      notify('error', 'Erreur lors du changement de statut : ' + err.message);
    }
  };

  const filtered = users.filter(usr => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [usr.prenom, usr.nom, usr.email, usr.telephone, usr.entrepriseNom, usr.poste]
      .filter(Boolean)
      .some(f => String(f).toLowerCase().includes(q));

    const matchRole = roleFilter === 'ALL' || usr.role === roleFilter;
    const matchEntreprise = entrepriseFilter === 'ALL' || usr.entrepriseId === entrepriseFilter;
    const matchStatut = statutFilter === 'ALL' || usr.statut === statutFilter;

    return matchSearch && matchRole && matchEntreprise && matchStatut;
  });

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="text-brand-blue-bright" size={32} />
            Gestion des Comptes & Accès Globaux
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Création et contrôle des comptes SuperAdmin, Administrateurs de Boîte et Agents.
          </p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setCreateOpen(true)} className="!rounded-xl">
          Créer un Compte
        </Btn>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`Comptes Utilisateurs (${filtered.length})`}
          subtitle="Aperçu des accès et contrôle des statuts (Actif / Suspendu / Désactivé)"
          actions={
            <Btn variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchUsersAndEntreprises(true)} loading={loading} className="text-[10px] font-black uppercase">
              Actualiser
            </Btn>
          }
        />

        {/* Filters */}
        <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, email, poste..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-brand-blue-bright/20 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black outline-none cursor-pointer"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="SUPERADMIN">SuperAdmin</option>
              <option value="ADMIN">Admin Boîte</option>
              <option value="AGENT">Agent</option>
            </select>

            <select
              value={entrepriseFilter}
              onChange={e => setEntrepriseFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les entreprises</option>
              {entreprises.map(ent => (
                <option key={ent.id || ent._id} value={ent.id || ent._id}>
                  {ent.nom}
                </option>
              ))}
            </select>

            <select
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black outline-none cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIF">Actifs</option>
              <option value="SUSPENDU">Suspendus</option>
              <option value="DESACTIVE">Désactivés</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Entreprise Rattachée</th>
                <th className="py-3 px-4">Poste / Dept</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {filtered.map(usr => (
                <tr key={usr.id || usr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-blue-bright font-black flex items-center justify-center text-xs">
                        {(usr.prenom?.[0] || 'U') + (usr.nom?.[0] || '')}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-sm">{usr.prenom} {usr.nom}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{usr.email} · {usr.telephone || 'Sans tel'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                      usr.role === 'SUPERADMIN' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                      usr.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    }`}>
                      {usr.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {usr.entrepriseNom || '— (Supervision)'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    <p>{usr.poste || '—'}</p>
                    <p className="opacity-70">{usr.departement || ''}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      usr.statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600' :
                      usr.statut === 'SUSPENDU' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {usr.statut || 'ACTIF'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {usr.statut !== 'ACTIF' && (
                        <Btn
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(usr.id || usr._id, 'ACTIF')}
                          className="text-[10px] font-black uppercase py-1 px-2.5"
                        >
                          Activer
                        </Btn>
                      )}
                      {usr.statut !== 'SUSPENDU' && (
                        <Btn
                          variant="warning"
                          size="sm"
                          onClick={() => handleStatusChange(usr.id || usr._id, 'SUSPENDU')}
                          className="text-[10px] font-black uppercase py-1 px-2.5"
                        >
                          Suspendre
                        </Btn>
                      )}
                      {usr.statut !== 'DESACTIVE' && (
                        <Btn
                          variant="danger"
                          size="sm"
                          onClick={() => handleStatusChange(usr.id || usr._id, 'DESACTIVE')}
                          className="text-[10px] font-black uppercase py-1 px-2.5"
                        >
                          Désactiver
                        </Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-bold">
                    Aucun compte utilisateur ne correspond aux critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Création Compte */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Créer un Compte Utilisateur" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Prénom"
              id="prenom"
              required
              value={createForm.prenom}
              onChange={e => setCreateForm(f => ({ ...f, prenom: e.target.value }))}
              icon={User}
              placeholder="Ex: Abdoulaye"
            />
            <FormInput
              label="Nom"
              id="nom"
              required
              value={createForm.nom}
              onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Sow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Email de Connexion"
              id="email"
              type="email"
              required
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              icon={Mail}
              placeholder="a.sow@entreprise.sn"
            />
            <FormInput
              label="Mot de passe"
              id="password"
              type="password"
              required
              value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              icon={Lock}
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Rôle du Compte"
              id="role"
              value={createForm.role}
              onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
              options={[
                { value: 'ADMIN', label: 'Admin d\'Entreprise' },
                { value: 'AGENT', label: 'Agent de Sécurité / Accueil' },
                { value: 'SUPERADMIN', label: 'SuperAdmin Global' },
              ]}
            />

            {createForm.role !== 'SUPERADMIN' ? (
              <FormSelect
                label="Entreprise Rattachée"
                id="entrepriseId"
                required
                value={createForm.entrepriseId}
                onChange={e => handleEntrepriseChange(e.target.value)}
                options={entreprises.map(e => ({ value: e.id || e._id, label: e.nom }))}
                placeholder="Sélectionner la boîte..."
              />
            ) : (
              <FormInput
                label="Périmètre"
                id="perimetre"
                value="Global (Toutes Entreprises)"
                disabled
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Téléphone"
              id="telephone"
              value={createForm.telephone}
              onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value }))}
              icon={Phone}
              placeholder="+221 77 000 00 00"
            />
            <FormInput
              label="Poste / Fonction"
              id="poste"
              value={createForm.poste}
              onChange={e => setCreateForm(f => ({ ...f, poste: e.target.value }))}
              icon={Briefcase}
              placeholder="Agent d'accueil, Responsable..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setCreateOpen(false)} fullWidth type="button">
              Annuler
            </Btn>
            <Btn variant="success" type="submit" loading={creating} icon={CheckCircle2} fullWidth>
              Créer le Compte
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
