import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Search, Power, Phone, Mail, MapPin, Briefcase, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/useAppState';
import { Card, CardHeader, Btn, FormInput, FormSelect, Modal } from '../../components/UI';
import { entrepriseService } from '../../services/entrepriseService';
import { TRANSLATIONS } from '../../translations';

const EMPTY_ENTREPRISE = {
  nom: '',
  immatriculation: '',
  adresse: '',
  email: '',
  telephone: '',
  secteur: 'Maritime / Logistique',
  statut: 'ACTIF',
};

export default function EntreprisesManagement({ isMobile }) {
  const { state, notify } = useApp();
  const t = TRANSLATIONS[state.settings?.language || 'fr'];

  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('ALL');

  // Modal création
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_ENTREPRISE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchEntreprises = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await entrepriseService.getAll();
      setEntreprises(Array.isArray(data) ? data : (data?.entreprises || []));
    } catch (err) {
      notify('error', 'Erreur lors du chargement des entreprises.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchEntreprises();
  }, [fetchEntreprises]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.nom.trim()) {
      setCreateError('Le nom de l\'entreprise est obligatoire.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      await entrepriseService.create(createForm);
      notify('success', `Entreprise "${createForm.nom}" créée avec succès.`);
      setCreateForm(EMPTY_ENTREPRISE);
      setCreateOpen(false);
      fetchEntreprises(true);
    } catch (err) {
      setCreateError(err.message || 'Erreur lors de la création de l\'entreprise.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    try {
      await entrepriseService.updateStatus(id, nextStatus);
      notify('success', `Statut entreprise mis à jour (${nextStatus}).`);
      fetchEntreprises(true);
    } catch (err) {
      notify('error', 'Erreur lors du changement de statut : ' + err.message);
    }
  };

  const filtered = entreprises.filter(ent => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [ent.nom, ent.email, ent.telephone, ent.immatriculation, ent.secteur]
      .filter(Boolean)
      .some(f => String(f).toLowerCase().includes(q));
    const matchStatut = filterStatut === 'ALL' || ent.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Building2 className="text-brand-blue-bright" size={32} />
            Gestion des Entreprises & Boîtes
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Création, configuration et supervision des entités inscrites dans NoRegis.
          </p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setCreateOpen(true)} className="!rounded-xl">
          Créer une Entreprise
        </Btn>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader
          title={`Entreprises (${filtered.length})`}
          subtitle="Liste globale des structures rattachées"
          actions={
            <Btn variant="ghost" size="sm" icon={RefreshCw} onClick={() => fetchEntreprises(true)} loading={loading} className="text-[10px] font-black uppercase">
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
              placeholder="Rechercher une entreprise (Nom, NINEA, email...)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-brand-blue-bright/20 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none"
            />
          </div>

          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black outline-none cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIF">Actives</option>
            <option value="SUSPENDU">Suspendues</option>
          </select>
        </div>

        {/* Table */}
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Nom de l'Entreprise</th>
                <th className="py-3 px-4">NINEA / Registre</th>
                <th className="py-3 px-4">Secteur</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {filtered.map(ent => (
                <tr key={ent.id || ent._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-blue-bright/10 text-brand-blue-bright flex items-center justify-center font-black">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-sm">{ent.nom}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {ent.adresse || 'Adresse non renseignée'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {ent.immatriculation || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {ent.secteur || 'Autre'}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-slate-900 dark:text-white">{ent.email || '—'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{ent.telephone}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      ent.statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {ent.statut || 'ACTIF'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Btn
                      variant={ent.statut === 'ACTIF' ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => handleToggleStatus(ent.id || ent._id, ent.statut || 'ACTIF')}
                      className="text-[10px] font-black uppercase"
                    >
                      {ent.statut === 'ACTIF' ? 'Suspendre' : 'Activer'}
                    </Btn>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-bold">
                    Aucune entreprise ne correspond aux critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Création Entreprise */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Créer une Nouvelle Entreprise" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs font-bold">
              {createError}
            </div>
          )}

          <FormInput
            label="Nom de l'Entreprise"
            id="nom"
            required
            value={createForm.nom}
            onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))}
            icon={Building2}
            placeholder="Ex: Port Autonome de Dakar"
          />

          <FormInput
            label="NINEA / Registre du Commerce"
            id="immatriculation"
            value={createForm.immatriculation}
            onChange={e => setCreateForm(f => ({ ...f, immatriculation: e.target.value }))}
            icon={Briefcase}
            placeholder="Ex: SN-DKR-2025-B-1234"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Email Professionnel"
              id="email"
              type="email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              icon={Mail}
              placeholder="contact@entreprise.sn"
            />
            <FormInput
              label="Téléphone Contact"
              id="telephone"
              value={createForm.telephone}
              onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value }))}
              icon={Phone}
              placeholder="+221 33 800 00 00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Secteur d'Activité"
              id="secteur"
              value={createForm.secteur}
              onChange={e => setCreateForm(f => ({ ...f, secteur: e.target.value }))}
              options={['Maritime / Logistique', 'Énergie', 'Télécommunications', 'Banque / Finance', 'Santé', 'Administration Publique', 'Industrie', 'Autre']}
            />
            <FormSelect
              label="Statut Initial"
              id="statut"
              value={createForm.statut}
              onChange={e => setCreateForm(f => ({ ...f, statut: e.target.value }))}
              options={[{ value: 'ACTIF', label: 'Actif' }, { value: 'SUSPENDU', label: 'Suspendu' }]}
            />
          </div>

          <FormInput
            label="Adresse Siège Social"
            id="adresse"
            value={createForm.adresse}
            onChange={e => setCreateForm(f => ({ ...f, adresse: e.target.value }))}
            icon={MapPin}
            placeholder="Ville, Quartier, Rue..."
          />

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Btn variant="secondary" onClick={() => setCreateOpen(false)} fullWidth type="button">
              Annuler
            </Btn>
            <Btn variant="success" type="submit" loading={creating} icon={CheckCircle2} fullWidth>
              Valider & Créer
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
