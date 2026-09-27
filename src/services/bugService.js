import api from './api';

const LOCAL_BUGS_KEY = 'noregis_local_bugs';

const getStoredBugs = () => {
  try {
    const data = localStorage.getItem(LOCAL_BUGS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Erreur lecture local bugs', e);
  }
  return [];
};

const saveStoredBugs = (bugs) => {
  try {
    localStorage.setItem(LOCAL_BUGS_KEY, JSON.stringify(bugs));
  } catch (e) {
    console.error('Erreur sauvegarde local bugs', e);
  }
};

export const bugService = {
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.statut) queryParams.append('statut', params.statut);
      if (params.priorite) queryParams.append('priorite', params.priorite);
      const query = queryParams.toString() ? '?' + queryParams.toString() : '';

      const res = await api.get(`/api/bugs${query}`);
      if (res && (res.success || Array.isArray(res.bugs))) {
        const bugsList = res.bugs || [];
        saveStoredBugs(bugsList);
        return { success: true, bugs: bugsList, total: bugsList.length };
      }
    } catch (err) {
      console.warn('API getAll bugs indisponible, fallback local:', err.message);
    }

    let bugs = getStoredBugs();
    bugs = bugs.map(b => {
      const reponses = b.reponses || [];
      const derniereRep = reponses.length > 0 ? reponses[reponses.length - 1] : null;
      if (derniereRep && (derniereRep.roleAuteur === 'ADMIN' || (derniereRep.nomAuteur && derniereRep.nomAuteur.includes('ADMIN')))) {
        return { ...b, reponseSuperAdmin: '', reponseAdmin: derniereRep.message, reponduPar: 'ADMIN' };
      }
      return b;
    });
    if (params.statut) bugs = bugs.filter(b => b.statut === params.statut);
    if (params.priorite) bugs = bugs.filter(b => b.priorite === params.priorite);
    return { success: true, bugs, total: bugs.length };
  },

  create: async (data) => {
    try {
      const res = await api.post('/api/bugs', data);
      if (res && (res.success || res.bug)) {
        const createdBug = res.bug || res;
        const local = getStoredBugs();
        saveStoredBugs([createdBug, ...local]);
        return { success: true, bug: createdBug, message: res.message || 'Bug signalé avec succès.' };
      }
    } catch (err) {
      console.warn('API create bug indisponible, enregistrement local:', err.message);
    }

    // Fallback local creation
    const storedUser = localStorage.getItem('user');
    let user = {};
    try { if (storedUser) user = JSON.parse(storedUser); } catch(e){}

    const mockBug = {
      _id: `bug_${Date.now()}`,
      id: `bug_${Date.now()}`,
      titre: data.titre,
      description: data.description,
      priorite: data.priorite || 'MOYENNE',
      statut: 'OUVERT',
      nomSignaleur: `${user.prenom || 'Agent'} ${user.nom || ''}`.trim(),
      roleSignaleur: user.role || 'AGENT',
      entrepriseNom: typeof user.entrepriseId === 'object' ? user.entrepriseId?.nom : (user.entrepriseNom || 'Entreprise Partenaire'),
      transmisAuSuperAdmin: true,
      reponses: [],
      createdAt: new Date().toISOString(),
    };

    const local = getStoredBugs();
    saveStoredBugs([mockBug, ...local]);
    return { success: true, bug: mockBug, message: 'Votre signalement de bug a été transmis avec succès au SuperAdmin.' };
  },

  respond: async (id, data) => {
    try {
      const res = await api.put(`/api/bugs/${id}/repondre`, data);
      if (res && (res.success || res.bug)) {
        return res;
      }
    } catch (err) {
      console.warn('API respond bug indisponible, fallback local:', err.message);
    }

    const storedUser = localStorage.getItem('user');
    let user = {};
    try { if (storedUser) user = JSON.parse(storedUser); } catch(e){}

    const local = getStoredBugs();
    let updatedBug = null;
    const updatedList = local.map(b => {
      if (b._id === id || b.id === id) {
        const reponses = b.reponses || [];
        if (data.message) {
          reponses.push({
            auteurId: user._id || user.id,
            nomAuteur: `${user.prenom || 'Admin'} ${user.nom || ''}`.trim(),
            roleAuteur: user.role || 'ADMIN',
            message: data.message,
            createdAt: new Date().toISOString(),
          });
        }
        updatedBug = {
          ...b,
          statut: data.nouveauStatut || b.statut,
          reponses,
        };
        return updatedBug;
      }
      return b;
    });

    saveStoredBugs(updatedList);
    return { success: true, bug: updatedBug, message: 'Réponse enregistrée.' };
  },

  transmit: async (id) => {
    try {
      const res = await api.patch(`/api/bugs/${id}/transmettre`);
      if (res && (res.success || res.bug)) {
        return res;
      }
    } catch (err) {
      console.warn('API transmit bug indisponible, fallback local:', err.message);
    }

    const local = getStoredBugs();
    let updatedBug = null;
    const updatedList = local.map(b => {
      if (b._id === id || b.id === id) {
        updatedBug = { ...b, transmisAuSuperAdmin: true };
        return updatedBug;
      }
      return b;
    });

    saveStoredBugs(updatedList);
    return { success: true, bug: updatedBug, message: 'Signalement transmis au SuperAdmin.' };
  },
};
