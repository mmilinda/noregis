import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Search, Mail, Lock, User, Phone, Building2, Briefcase, RefreshCw, CheckCircle2, Edit, History, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, FormInput, FormSelect, Modal } from '../../components/UI';
import { authService } from '../../services/authService';
import { entrepriseService } from '../../services/entrepriseService';
import { TRANSLATIONS } from '../../translations';

const EMPTY_ADMIN = {
  email: '',
  password: '',
  prenom: '',
  nom: '',
  role: 'ADMIN',
  entrepriseId: '',
  entrepriseNom: '',
  telephone: '',
  departement: 'Direction / Admin',
  poste: 'Administrateur de Boîte',
};

export default function AdminsManagement({ isMobile }) {
  const { state, notify } = useApp();
  const navigate = useNavigate();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const [admins, setAdmins] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entrepriseFilter, setEntrepriseFilter] = useState('ALL');
  const [statutFilter, setStatutFilter] = useState('ALL');

  // Modal création
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_ADMIN);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal modification
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchAdminsAndEntreprises = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [usrData, entData] = await Promise.all([
        authService.getAllUsers(null, 'ADMIN'),
        entrepriseService.getAll(),
      ]);
      const rawUsers = usrData?.utilisateurs || (Array.isArray(usrData) ? usrData : []);
      const adminList = rawUsers.filter(u => u.role === 'ADMIN');
      setAdmins(adminList);
      setEntreprises(Array.isArray(entData) ? entData : (entData?.entreprises || []));
    } catch (err) {
      notify('error', 'Erreur lors du chargement des Administrateurs.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchAdminsAndEntreprises();
  }, [fetchAdminsAndEntreprises]);

  const handleEntrepriseChange = (entId, isEdit = false) => {
    const ent = entreprises.find(e => (e.id === entId || e._id === entId));
    if (isEdit) {
      setEditForm(f => ({
        ...f,
        entrepriseId: entId,
        entrepriseNom: ent ? ent.nom : '',
      }));
    } else {
      setCreateForm(f => ({
        ...f,
        entrepriseId: entId,
        entrepriseNom: ent ? ent.nom : '',
      }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.email.trim() || !createForm.password.trim() || !createForm.prenom.trim() || !createForm.nom.trim()) {
      setCreateError('Veuillez remplir tous les champs obligatoires (Email, Mot de passe, Prénom, Nom).');
      return;
    }

    if (!createForm.entrepriseId) {
      setCreateError('Veuillez sélectionner l\'entreprise rattachée à cet administrateur.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      await authService.createUser(createForm);
      notify('success', `Administrateur "${createForm.prenom} ${createForm.nom}" créé avec succès.`);
      setCreateForm(EMPTY_ADMIN);
      setCreateOpen(false);
      fetchAdminsAndEntreprises(true);
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création de l\'administrateur.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditOpen = (adminObj) => {
    const entId = adminObj.entrepriseId?._id || adminObj.entrepriseId || '';
    setEditForm({
      id: adminObj.id || adminObj._id,
      prenom: adminObj.prenom || '',
      nom: adminObj.nom || '',
      email: adminObj.email || '',
      telephone: adminObj.telephone || '',
      entrepriseId: entId,
      entrepriseNom: adminObj.entrepriseNom || adminObj.entrepriseId?.nom || '',
      poste: adminObj.poste || 'Administrateur de Boîte',
      departement: adminObj.departement || 'Admin',
      password: '',
      statutCompte: adminObj.statutCompte || 'ACTIF',
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.prenom.trim() || !editForm.nom.trim() || !editForm.email.trim()) {
      setEditError('Les champs Prénom, Nom et Email sont obligatoires.');
      return;
    }

    setEditing(true);
    setEditError('');

    try {
      await authService.updateUserProfile(editForm.id, editForm);
      notify('success', `Administrateur "${editForm.prenom} ${editForm.nom}" mis à jour.`);
      setEditOpen(false);
      fetchAdminsAndEntreprises(true);
    } catch (err) {
      setEditError(err.message || 'Erreur lors de la mise à jour de l\'administrateur.');
    } finally {
      setEditing(false);
    }
  };

  const handleStatusChange = async (id, targetStatus) => {
    try {
      await authService.updateUserStatus(id, targetStatus);
      notify('success', `Statut Administrateur mis à jour (${targetStatus}).`);
      fetchAdminsAndEntreprises(true);
    } catch (err) {
      notify('error', 'Erreur lors du changement de statut : ' + err.message);
    }
  };

  const handleViewHistory = (entId) => {
    if (entId) {
      navigate(`/history?entrepriseId=${entId}`);
    } else {
      navigate('/history');
    }
  };

  const filtered = admins.filter(adm => {
    const q = search.trim().toLowerCase();
    const entId = adm.entrepriseId?._id || adm.entrepriseId;
    const matchSearch = !q || [adm.prenom, adm.nom, adm.email, adm.telephone, adm.entrepriseNom, adm.entrepriseId?.nom]
      .filter(Boolean)
      .some(f => String(f).toLowerCase().includes(q));

    const matchEntreprise = entrepriseFilter === 'ALL' || String(entId) === String(entrepriseFilter);
    const matchStatut = statutFilter === 'ALL' || (adm.statutCompte || 'ACTIF') === statutFilter;

    return matchSearch && matchEntreprise && matchStatut;
  });

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="text-brand-blue-bright" size={32} />
            Gestion des Administrateurs de Boîte
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Création, édition et supervision des comptes d'administration d'entreprises.
          </p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setCreateOpen(true)} className="!rounded-xl">
          Créer un Administrateur
        </Btn>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`Administrateurs (${filtered.length})`}
          subtitle="Comptes responsables de la gestion interne des entreprises"
          actions={
            <Btn variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchAdminsAndEntreprises(true)} loading={loading} className="text-[10px] font-black uppercase">
              Actualiser
            </Btn>
          }
        />

        {/* Filters */}
        <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un administrateur (Nom, Email, Entreprise)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-brand-blue-bright/20 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none"
            />
          </div>

          <div className="flex gap-2">
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
        <div className="p-3 sm:p-4 overflow-hidden w-full">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                <th className="py-2.5 px-3 w-[28%]">Administrateur</th>
                <th className="py-2.5 px-2 w-[24%]">Entreprise</th>
                <th className="py-2.5 px-2 w-[24%]">Contact</th>
                <th className="py-2.5 px-2 w-[10%]">Statut</th>
                <th className="py-2.5 px-3 w-[14%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {filtered.map(adm => {
                const entId = adm.entrepriseId?._id || adm.entrepriseId;
                const entName = adm.entrepriseId?.nom || adm.entrepriseNom || '—';
                const currentStatus = adm.statutCompte || 'ACTIF';

                return (
                  <tr key={adm.id || adm._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 font-black flex items-center justify-center text-[11px] shrink-0">
                          {(adm.prenom?.[0] || 'A') + (adm.nom?.[0] || '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-900 dark:text-white text-xs truncate leading-tight">{adm.prenom} {adm.nom}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{adm.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-900 dark:text-white font-bold min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 size={13} className="text-brand-blue-bright shrink-0" />
                        <span className="truncate text-xs">{entName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 font-mono text-xs min-w-0">
                      <p className="truncate">{adm.telephone || '—'}</p>
                    </td>
                    <td className="py-2.5 px-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block truncate max-w-full ${
                        currentStatus === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600' :
                        currentStatus === 'SUSPENDU' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {currentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right min-w-0">
                      <div className="flex justify-end items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleViewHistory(entId)}
                          className="p-1.5 rounded-lg text-brand-blue-bright bg-brand-blue-bright/10 hover:bg-brand-blue-bright/20 transition-all shrink-0"
                          title="Historique de l'entreprise"
                        >
                          <History size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditOpen(adm)}
                          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all shrink-0"
                          title="Modifier"
                        >
                          <Edit size={13} />
                        </button>

                        {currentStatus !== 'ACTIF' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(adm.id || adm._id, 'ACTIF')}
                            className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-[9px] font-black uppercase text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all shrink-0 flex items-center gap-1"
                            title="Activer"
                          >
                            <UserCheck size={13} />
                            <span className="hidden xl:inline">Activer</span>
                          </button>
                        )}
                        {currentStatus !== 'SUSPENDU' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(adm.id || adm._id, 'SUSPENDU')}
                            className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-[9px] font-black uppercase text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all shrink-0 flex items-center gap-1"
                            title="Suspendre"
                          >
                            <AlertCircle size={13} />
                            <span className="hidden xl:inline">Suspendre</span>
                          </button>
                        )}
                        {currentStatus !== 'DESACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(adm.id || adm._id, 'DESACTIVE')}
                            className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-[9px] font-black uppercase text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all shrink-0 flex items-center gap-1"
                            title="Désactiver"
                          >
                            <UserX size={13} />
                            <span className="hidden xl:inline">Désactiver</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-bold">
                    Aucun administrateur de boîte trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Création Administrateur */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Créer un Administrateur de Boîte" size="md">
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
              placeholder="Ex: Cheikh"
            />
            <FormInput
              label="Nom"
              id="nom"
              required
              value={createForm.nom}
              onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Ndiaye"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Email Professionnel"
              id="email"
              type="email"
              required
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              icon={Mail}
              placeholder="admin@entreprise.sn"
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

          <FormSelect
            label="Entreprise Rattachée"
            id="entrepriseId"
            required
            value={createForm.entrepriseId}
            onChange={e => handleEntrepriseChange(e.target.value)}
            options={entreprises.map(e => ({ value: e.id || e._id, label: e.nom }))}
            placeholder="Sélectionner l'entreprise..."
          />

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
              label="Poste"
              id="poste"
              value={createForm.poste}
              onChange={e => setCreateForm(f => ({ ...f, poste: e.target.value }))}
              icon={Briefcase}
              placeholder="Administrateur Général"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setCreateOpen(false)} fullWidth type="button">
              Annuler
            </Btn>
            <Btn variant="success" type="submit" loading={creating} icon={CheckCircle2} fullWidth>
              Créer l'Administrateur
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal Modification Administrateur */}
      {editOpen && editForm && (
        <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Modifier l'Administrateur de Boîte" size="md">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Prénom"
                id="edit_prenom"
                required
                value={editForm.prenom}
                onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))}
                icon={User}
              />
              <FormInput
                label="Nom"
                id="edit_nom"
                required
                value={editForm.nom}
                onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Email"
                id="edit_email"
                type="email"
                required
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                icon={Mail}
              />
              <FormInput
                label="Nouveau Mot de Passe (Optionnel)"
                id="edit_password"
                type="password"
                value={editForm.password}
                onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                icon={Lock}
                placeholder="Laisser vide pour conserver"
              />
            </div>

            <FormSelect
              label="Entreprise Rattachée"
              id="edit_entrepriseId"
              required
              value={editForm.entrepriseId}
              onChange={e => handleEntrepriseChange(e.target.value, true)}
              options={entreprises.map(e => ({ value: e.id || e._id, label: e.nom }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Téléphone"
                id="edit_telephone"
                value={editForm.telephone}
                onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))}
                icon={Phone}
              />
              <FormSelect
                label="Statut du Compte"
                id="edit_statut"
                value={editForm.statutCompte}
                onChange={e => setEditForm(f => ({ ...f, statutCompte: e.target.value }))}
                options={[
                  { value: 'ACTIF', label: 'Actif' },
                  { value: 'SUSPENDU', label: 'Suspendu' },
                  { value: 'DESACTIVE', label: 'Désactivé' },
                ]}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Btn variant="secondary" onClick={() => setEditOpen(false)} fullWidth type="button">
                Annuler
              </Btn>
              <Btn variant="primary" type="submit" loading={editing} icon={CheckCircle2} fullWidth>
                Enregistrer les Modifications
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
