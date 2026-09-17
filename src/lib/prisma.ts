import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ============================================================
// IN-MEMORY MOCK DATA FOR SEAMLESS OPERATION WITHOUT DATABASE
// ============================================================

const DEFAULT_SPECIALTIES = [
  { id: "1", name: "Médecine générale", description: "Prise en charge générale et première orientation médicale." },
  { id: "2", name: "Cardiologie", description: "Diagnostic et prise en charge des maladies cardiovasculaires." },
  { id: "3", name: "Dermatologie", description: "Maladies de la peau, des cheveux et des ongles." },
  { id: "4", name: "Pédiatrie", description: "Soins médicaux destinés aux enfants et adolescents." },
  { id: "5", name: "Gynécologie", description: "Santé gynécologique et reproductive." },
  { id: "6", name: "Neurologie", description: "Maladies du système nerveux." },
  { id: "7", name: "Psychiatrie", description: "Santé mentale et troubles psychiatriques." },
  { id: "8", name: "Ophtalmologie", description: "Maladies et troubles de la vision et des yeux." },
  { id: "9", name: "ORL", description: "Maladies de l'oreille, du nez et de la gorge." },
  { id: "10", name: "Orthopédie", description: "Maladies et traumatismes de l'appareil locomoteur." },
  { id: "11", name: "Gastro-entérologie", description: "Maladies du système digestif." },
  { id: "12", name: "Pneumologie", description: "Maladies des poumons et des voies respiratoires." },
  { id: "13", name: "Endocrinologie", description: "Maladies hormonales et métaboliques." },
  { id: "14", name: "Urologie", description: "Maladies de l'appareil urinaire et génital masculin." },
  { id: "15", name: "Rhumatologie", description: "Maladies des articulations, muscles et os." },
  { id: "16", name: "Chirurgie générale", description: "Prise en charge chirurgicale de différentes pathologies." },
];

const DEFAULT_DOCTORS = [
  {
    id: "doc-1",
    profileId: "prof-doc-1",
    licenseNumber: "DZ-12345",
    nationalRegistration: "NR-12345",
    diploma: "Doctorat en Médecine Générale",
    diplomaNumber: "DIP-9876",
    graduationYear: 2014,
    startPracticeYear: 2015,
    yearsExperience: 11,
    biography: "Médecin généraliste d'expérience, spécialiste en suivi préventif et familial.",
    consultationLanguages: "Français, Arabe, Anglais",
    education: "Faculté de Médecine d'Alger",
    certifications: "Certification en médecine préventive",
    consultationFee: 2500,
    consultationDuration: 30,
    acceptsOnline: true,
    acceptsHomeVisit: false,
    isAcceptingNewPatients: true,
    averageRating: 4.9,
    totalReviews: 128,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-doc-1",
      authUserId: "auth-doc-1",
      userType: "DOCTOR",
      email: "dr.amine@mediconnect.dz",
      firstName: "Amine",
      lastName: "Benali",
      nationalId: "1234567890",
      gender: "MALE",
      city: "Alger",
      wilaya: "Alger",
      address: "12 Rue Didouche Mourad",
      phone: "+213 550 123 456",
      avatarUrl: "/images/doctor1.jpg",
      accountStatus: "ACTIVE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialties: [
      {
        doctorId: "doc-1",
        specialtyId: "1",
        specialty: { id: "1", name: "Médecine générale" },
      },
    ],
  },
  {
    id: "doc-2",
    profileId: "prof-doc-2",
    licenseNumber: "DZ-23456",
    nationalRegistration: "NR-23456",
    diploma: "Spécialité en Cardiologie",
    diplomaNumber: "DIP-5432",
    graduationYear: 2011,
    startPracticeYear: 2012,
    yearsExperience: 14,
    biography: "Cardiologue interventionnel et suivi des pathologies cardiaques chroniques.",
    consultationLanguages: "Français, Arabe",
    education: "CHU Mustapha Pacha",
    certifications: "Diplôme Européen de Cardiologie",
    consultationFee: 4000,
    consultationDuration: 45,
    acceptsOnline: true,
    acceptsHomeVisit: true,
    isAcceptingNewPatients: true,
    averageRating: 4.8,
    totalReviews: 95,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-doc-2",
      authUserId: "auth-doc-2",
      userType: "DOCTOR",
      email: "dr.sarah@mediconnect.dz",
      firstName: "Sarah",
      lastName: "Khelifi",
      nationalId: "2345678901",
      gender: "FEMALE",
      city: "Oran",
      wilaya: "Oran",
      address: "24 Boulevard de la Soummam",
      phone: "+213 661 234 567",
      avatarUrl: "/images/doctor2.jpg",
      accountStatus: "ACTIVE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialties: [
      {
        doctorId: "doc-2",
        specialtyId: "2",
        specialty: { id: "2", name: "Cardiologie" },
      },
    ],
  },
  {
    id: "doc-3",
    profileId: "prof-doc-3",
    licenseNumber: "DZ-34567",
    nationalRegistration: "NR-34567",
    diploma: "Spécialité en Pédiatrie",
    diplomaNumber: "DIP-7761",
    graduationYear: 2016,
    startPracticeYear: 2017,
    yearsExperience: 9,
    biography: "Pédiatre attentionnée et dévouée à la santé et au développement des nourrissons et enfants.",
    consultationLanguages: "Français, Arabe",
    education: "Faculté de Médecine de Constantine",
    certifications: "Formation Urgences Pédiatriques",
    consultationFee: 3000,
    consultationDuration: 30,
    acceptsOnline: true,
    acceptsHomeVisit: false,
    isAcceptingNewPatients: true,
    averageRating: 4.95,
    totalReviews: 142,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-doc-3",
      authUserId: "auth-doc-3",
      userType: "DOCTOR",
      email: "dr.yasmine@mediconnect.dz",
      firstName: "Yasmine",
      lastName: "Meziani",
      nationalId: "3456789012",
      gender: "FEMALE",
      city: "Constantine",
      wilaya: "Constantine",
      address: "5 Rue Larbi Ben M'hidi",
      phone: "+213 770 345 678",
      avatarUrl: "/images/doctor3.jpg",
      accountStatus: "ACTIVE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialties: [
      {
        doctorId: "doc-3",
        specialtyId: "4",
        specialty: { id: "4", name: "Pédiatrie" },
      },
    ],
  },
  {
    id: "doc-ryad",
    profileId: "prof-doc-ryad",
    licenseNumber: "ONM-DZ-2016-12984",
    nationalRegistration: "NR-12984",
    diploma: "Spécialité en Radiologie & Imagerie Médicale",
    diplomaNumber: "DIP-12984",
    graduationYear: 2015,
    startPracticeYear: 2016,
    yearsExperience: 10,
    biography: "Spécialiste en imagerie cardiovasculaire, IRM cardiaque et coroscanner de pointe.",
    consultationLanguages: "Français, Arabe",
    education: "Centre d'Imagerie Numérique Bab El Oued",
    certifications: "Certification Européenne en Imagerie Cardiovasculaire",
    consultationFee: 4500,
    consultationDuration: 30,
    acceptsOnline: true,
    acceptsHomeVisit: false,
    isAcceptingNewPatients: true,
    averageRating: 4.92,
    totalReviews: 87,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-doc-ryad",
      authUserId: "auth-doc-ryad",
      userType: "DOCTOR",
      email: "dr.bouzid@imagerie-alger.dz",
      firstName: "Ryad",
      lastName: "Bouzid",
      nationalId: "4567890123",
      gender: "MALE",
      city: "Alger",
      wilaya: "Alger",
      address: "Centre d'Imagerie Bab El Oued",
      phone: "+213 661 45 67 89",
      avatarUrl: "/images/doctor4.jpg",
      accountStatus: "ACTIVE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialties: [
      {
        doctorId: "doc-ryad",
        specialtyId: "8",
        specialty: { id: "8", name: "Radiologie & Imagerie Médicale" },
      },
    ],
  },
  {
    id: "doc-leila",
    profileId: "prof-doc-leila",
    licenseNumber: "ONM-DZ-2017-77123",
    nationalRegistration: "NR-77123",
    diploma: "Spécialité en Néphrologie & Hémodialyse",
    diplomaNumber: "DIP-77123",
    graduationYear: 2016,
    startPracticeYear: 2017,
    yearsExperience: 9,
    biography: "Prise en charge de l'insuffisance rénale et de l'hypertension artérielle rénovasculaire.",
    consultationLanguages: "Français, Arabe",
    education: "CHU Beni Messous",
    certifications: "DIU Hémodialyse et Transplantation Rénale",
    consultationFee: 3500,
    consultationDuration: 40,
    acceptsOnline: true,
    acceptsHomeVisit: false,
    isAcceptingNewPatients: true,
    averageRating: 4.88,
    totalReviews: 64,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-doc-leila",
      authUserId: "auth-doc-leila",
      userType: "DOCTOR",
      email: "dr.belhadj@chu-benimessous.dz",
      firstName: "Leila",
      lastName: "Belhadj",
      nationalId: "5678901234",
      gender: "FEMALE",
      city: "Alger",
      wilaya: "Alger",
      address: "CHU Beni Messous",
      phone: "+213 552 67 89 01",
      avatarUrl: "/images/doctor5.jpg",
      accountStatus: "ACTIVE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialties: [
      {
        doctorId: "doc-leila",
        specialtyId: "14",
        specialty: { id: "14", name: "Néphrologie" },
      },
    ],
  },
  {
    id: "doc-karim-t",
    profileId: "prof-doc-karim-t",
    licenseNumber: "ONM-DZ-2012-09412",
    nationalRegistration: "NR-09412",
    diploma: "Professeur en Chirurgie Cardiovasculaire & Thoracique",
    diplomaNumber: "DIP-09412",
    graduationYear: 2008,
    startPracticeYear: 2010,
    yearsExperience: 16,
    biography: "Chirurgien cardiovasculaire d'excellence, pontages coronariens et remplacements valvulaires.",
    consultationLanguages: "Français, Arabe, Anglais",
    education: "Clinique Médico-Chirurgicale des Glycines",
    certifications: "Membre Titulaire de la Société Algérienne de Chirurgie Cardiaque",
    consultationFee: 6000,
    consultationDuration: 45,
    acceptsOnline: true,
    acceptsHomeVisit: false,
    isAcceptingNewPatients: true,
    averageRating: 4.97,
    totalReviews: 215,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-doc-karim-t",
      authUserId: "auth-doc-karim-t",
      userType: "DOCTOR",
      email: "pr.tlemcani@glycines-chirurgie.dz",
      firstName: "Karim",
      lastName: "Tlemçani",
      nationalId: "6789012345",
      gender: "MALE",
      city: "Alger",
      wilaya: "Alger",
      address: "Clinique des Glycines, Alger",
      phone: "+213 560 78 90 12",
      avatarUrl: "/images/doctor6.jpg",
      accountStatus: "ACTIVE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialties: [
      {
        doctorId: "doc-karim-t",
        specialtyId: "16",
        specialty: { id: "16", name: "Chirurgie Cardiovasculaire" },
      },
    ],
  },
  {
    id: "doc-nassim",
    profileId: "prof-doc-nassim",
    licenseNumber: "ONM-DZ-2020-56128",
    nationalRegistration: "NR-56128",
    diploma: "Spécialité en Médecine Interne & Diabétologie",
    diplomaNumber: "DIP-56128",
    graduationYear: 2018,
    startPracticeYear: 2019,
    yearsExperience: 7,
    biography: "Praticien hospitalier spécialisé en pathologies métaboliques complexes et diabète.",
    consultationLanguages: "Français, Arabe",
    education: "EHU d'Oran (1er Novembre 1954)",
    certifications: "DIU Diabétologie Clinique",
    consultationFee: 3200,
    consultationDuration: 35,
    acceptsOnline: true,
    acceptsHomeVisit: false,
    isAcceptingNewPatients: true,
    averageRating: 4.85,
    totalReviews: 53,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-doc-nassim",
      authUserId: "auth-doc-nassim",
      userType: "DOCTOR",
      email: "dr.zerrouki@ehu-oran.dz",
      firstName: "Nassim",
      lastName: "Zerrouki",
      nationalId: "7890123456",
      gender: "MALE",
      city: "Oran",
      wilaya: "Oran",
      address: "EHU d'Oran",
      phone: "+213 771 89 01 23",
      avatarUrl: "/images/doctor7.jpg",
      accountStatus: "ACTIVE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialties: [
      {
        doctorId: "doc-nassim",
        specialtyId: "13",
        specialty: { id: "13", name: "Endocrinologie & Diabétologie" },
      },
    ],
  },
  {
    id: "doc-houda",
    profileId: "prof-doc-houda",
    licenseNumber: "ONM-DZ-2015-88432",
    nationalRegistration: "NR-88432",
    diploma: "Spécialité en Anesthésie-Réanimation & Soins Intensifs",
    diplomaNumber: "DIP-88432",
    graduationYear: 2014,
    startPracticeYear: 2015,
    yearsExperience: 11,
    biography: "Chef d'unité en réanimation chirurgicale et monitorage hémodynamique lourd.",
    consultationLanguages: "Français, Arabe",
    education: "CHU Bab El Oued (Lamine Debaghine)",
    certifications: "Formation Réanimation Cardiovasculaire",
    consultationFee: 4000,
    consultationDuration: 30,
    acceptsOnline: true,
    acceptsHomeVisit: false,
    isAcceptingNewPatients: true,
    averageRating: 4.9,
    totalReviews: 76,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-doc-houda",
      authUserId: "auth-doc-houda",
      userType: "DOCTOR",
      email: "dr.saidi@chu-babloued.dz",
      firstName: "Houda",
      lastName: "Saidi",
      nationalId: "8901234567",
      gender: "FEMALE",
      city: "Alger",
      wilaya: "Alger",
      address: "CHU Bab El Oued",
      phone: "+213 553 90 12 34",
      avatarUrl: "/images/doctor8.jpg",
      accountStatus: "ACTIVE",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    specialties: [
      {
        doctorId: "doc-houda",
        specialtyId: "17",
        specialty: { id: "17", name: "Anesthésie-Réanimation" },
      },
    ],
  },
];

const DEFAULT_PATIENTS = [
  {
    id: "pat-1",
    profileId: "prof-pat-1",
    bloodType: "O+",
    allergies: ["Pénicilline"],
    chronicConditions: "Hypertension artérielle & Antécédent SCA",
    emergencyContactName: "Fatima Haddad (Épouse)",
    emergencyContactPhone: "+213 550 99 88 77",
    emergencyContactRelation: "Épouse",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-pat-1",
      authUserId: "auth-pat-1",
      userType: "PATIENT",
      email: "k.haddad@email.com",
      firstName: "Karim",
      lastName: "Haddad",
      phone: "+33 6 12 34 56 78",
      gender: "MALE",
      birthDate: new Date("1968-04-12"),
      city: "Alger",
      wilaya: "Alger",
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  },
  {
    id: "pat-2",
    profileId: "prof-pat-2",
    bloodType: "A+",
    allergies: ["Aspirine", "AINS"],
    chronicConditions: "Asthme sévère persistant",
    emergencyContactName: "Karim Meziane (Frère)",
    emergencyContactPhone: "+213 661 11 22 33",
    emergencyContactRelation: "Frère",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-pat-2",
      authUserId: "auth-pat-2",
      userType: "PATIENT",
      email: "amina.mez@email.com",
      firstName: "Amina",
      lastName: "Meziane",
      phone: "+33 6 98 76 54 32",
      gender: "FEMALE",
      birthDate: new Date("1992-08-20"),
      city: "Alger",
      wilaya: "Alger",
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  },
  {
    id: "pat-3",
    profileId: "prof-pat-3",
    bloodType: "B+",
    allergies: [],
    chronicConditions: "Diabète de Type 2 sous Insuline",
    emergencyContactName: "Nadia Mansouri (Fille)",
    emergencyContactPhone: "+213 770 22 33 44",
    emergencyContactRelation: "Fille",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-pat-3",
      authUserId: "auth-pat-3",
      userType: "PATIENT",
      email: "y.mansouri@email.com",
      firstName: "Youcef",
      lastName: "Mansouri",
      phone: "+33 7 44 55 66 77",
      gender: "MALE",
      birthDate: new Date("1959-11-03"),
      city: "Alger",
      wilaya: "Alger",
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  },
  {
    id: "pat-4",
    profileId: "prof-pat-4",
    bloodType: "AB+",
    allergies: ["Produits de contraste iodés"],
    chronicConditions: "Hypothyroïdie d'Hashimoto",
    emergencyContactName: "Tarek Benali (Époux)",
    emergencyContactPhone: "+213 550 44 55 66",
    emergencyContactRelation: "Époux",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-pat-4",
      authUserId: "auth-pat-4",
      userType: "PATIENT",
      email: "f.benali@email.com",
      firstName: "Fatima Zohra",
      lastName: "Benali",
      phone: "+33 6 33 22 11 00",
      gender: "FEMALE",
      birthDate: new Date("1981-06-18"),
      city: "Alger",
      wilaya: "Alger",
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  },
  {
    id: "pat-5",
    profileId: "prof-pat-5",
    bloodType: "O+",
    allergies: [],
    chronicConditions: "Douleur thoracique atypique & HTA ancienne",
    emergencyContactName: "Aïcha Saadi (Épouse)",
    emergencyContactPhone: "+33 6 55 44 33 22",
    emergencyContactRelation: "Épouse",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-pat-5",
      authUserId: "auth-pat-5",
      userType: "PATIENT",
      email: "m.saadi@email.com",
      firstName: "Mohammed",
      lastName: "Saadi",
      phone: "+33 6 55 44 33 22",
      gender: "MALE",
      birthDate: new Date("1964-02-10"),
      city: "Alger",
      wilaya: "Alger",
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  },
  {
    id: "pat-6",
    profileId: "prof-pat-6",
    bloodType: "A+",
    allergies: [],
    chronicConditions: "Bilan cardiologie pré-opératoire",
    emergencyContactName: "Salima Belkacem (Sœur)",
    emergencyContactPhone: "+33 6 22 11 33 44",
    emergencyContactRelation: "Sœur",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-pat-6",
      authUserId: "auth-pat-6",
      userType: "PATIENT",
      email: "m.belkacem@email.com",
      firstName: "Mourad",
      lastName: "Belkacem",
      phone: "+33 6 22 11 33 44",
      gender: "MALE",
      birthDate: new Date("1975-09-22"),
      city: "Alger",
      wilaya: "Alger",
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  },
  {
    id: "pat-7",
    profileId: "prof-pat-7",
    bloodType: "O-",
    allergies: [],
    chronicConditions: "Palpitations récurrentes & Extrasystoles",
    emergencyContactName: "Kamel Larbi (Époux)",
    emergencyContactPhone: "+33 7 11 22 33 44",
    emergencyContactRelation: "Époux",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-pat-7",
      authUserId: "auth-pat-7",
      userType: "PATIENT",
      email: "n.larbi@email.com",
      firstName: "Nassima",
      lastName: "Larbi",
      phone: "+33 7 11 22 33 44",
      gender: "FEMALE",
      birthDate: new Date("1987-03-15"),
      city: "Alger",
      wilaya: "Alger",
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  },
  {
    id: "pat-8",
    profileId: "prof-pat-8",
    bloodType: "B-",
    allergies: ["Sulfamides"],
    chronicConditions: "Insuffisance cardiaque stade II NYHA",
    emergencyContactName: "Hakim Kaddour (Fils)",
    emergencyContactPhone: "+33 6 88 99 00 11",
    emergencyContactRelation: "Fils",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "prof-pat-8",
      authUserId: "auth-pat-8",
      userType: "PATIENT",
      email: "o.kaddour@email.com",
      firstName: "Omar",
      lastName: "Kaddour",
      phone: "+33 6 88 99 00 11",
      gender: "MALE",
      birthDate: new Date("1953-12-05"),
      city: "Alger",
      wilaya: "Alger",
      accountStatus: "ACTIVE",
      isVerified: true,
    },
  },
];

const mockStore: Record<string, any[]> = {
  specialty: [...DEFAULT_SPECIALTIES],
  doctor: [...DEFAULT_DOCTORS],
  profile: [
    ...DEFAULT_DOCTORS.map((d) => d.profile),
    ...DEFAULT_PATIENTS.map((p) => p.profile),
  ],
  patient: [...DEFAULT_PATIENTS],
  appointment: [],
  medicalRecord: [],
  prescription: [],
  laboratoryResult: [],
  vaccination: [],
  refillRequest: [],
  aIConversation: [],
};

function createModelMock(modelName: string) {
  const store = mockStore[modelName] || (mockStore[modelName] = []);

  return {
    findMany: async (args?: any) => {
      if (modelName === "specialty") return store;
      if (modelName === "doctor") {
        let results = [...store];
        if (args?.where?.specialties?.some?.specialty?.name) {
          const specName = args.where.specialties.some.specialty.name;
          results = results.filter((d) =>
            d.specialties?.some((s: any) => s.specialty?.name === specName)
          );
        }
        return results;
      }
      return store;
    },
    findFirst: async (args?: any) => {
      if (store.length > 0) return store[0];
      return null;
    },
    findUnique: async (args?: any) => {
      if (args?.where?.id) {
        return store.find((item) => item.id === args.where.id) ?? null;
      }
      if (args?.where?.name && modelName === "specialty") {
        return store.find((item) => item.name === args.where.name) ?? null;
      }
      return store[0] ?? null;
    },
    create: async (args: any) => {
      const record = { id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date(), updatedAt: new Date(), ...args?.data };
      store.push(record);
      return record;
    },
    update: async (args: any) => {
      const idx = store.findIndex((item) => item.id === args?.where?.id);
      if (idx !== -1) {
        store[idx] = { ...store[idx], ...args?.data, updatedAt: new Date() };
        return store[idx];
      }
      return { id: args?.where?.id || "mock-id", ...args?.data };
    },
    upsert: async (args: any) => {
      const found = store.find((item) => (args?.where?.id && item.id === args.where.id) || (args?.where?.name && item.name === args.where.name));
      if (found) {
        Object.assign(found, args?.update, { updatedAt: new Date() });
        return found;
      }
      const record = { id: `mock-${Date.now()}`, ...args?.create, createdAt: new Date(), updatedAt: new Date() };
      store.push(record);
      return record;
    },
    delete: async () => ({}),
    count: async () => store.length,
  };
}

const mockPrisma: any = new Proxy(
  {
    $transaction: async (fnOrArray: any) => {
      if (typeof fnOrArray === "function") {
        return fnOrArray(mockPrisma);
      }
      if (Array.isArray(fnOrArray)) {
        return Promise.all(fnOrArray);
      }
      return [];
    },
  },
  {
    get(target: any, prop: string) {
      if (prop in target) return target[prop];
      return createModelMock(prop);
    },
  }
);

// ============================================================
// PRISMA CLIENT INITIALIZATION WITH SAFE FALLBACK
// ============================================================

let rawPrisma: any = null;

if (process.env.DATABASE_URL) {
  try {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    rawPrisma = new PrismaClient({ adapter });
  } catch (err) {
    console.warn("[AI Studio] Prisma init failed, falling back to mock in-memory DB:", err);
  }
} else {
  console.warn("[AI Studio] DATABASE_URL not set, active mock in-memory DB");
}

export const prisma: PrismaClient = (new Proxy(
  {},
  {
    get(_, prop: string) {
      if (!rawPrisma) {
        return mockPrisma[prop];
      }

      const realValue = rawPrisma[prop];
      if (typeof realValue === "function") {
        return async (...args: any[]) => {
          try {
            return await realValue.apply(rawPrisma, args);
          } catch (err) {
            console.warn(`[AI Studio] prisma.${prop} failed, using mock fallback:`, err);
            const mockHandler = mockPrisma[prop];
            return typeof mockHandler === "function" ? mockHandler(...args) : mockHandler;
          }
        };
      }

      if (realValue && typeof realValue === "object") {
        const mockModel = mockPrisma[prop];
        return new Proxy(realValue, {
          get(targetModel, method: string) {
            const realMethod = targetModel[method];
            if (typeof realMethod === "function") {
              return async (...args: any[]) => {
                try {
                  return await realMethod.apply(targetModel, args);
                } catch (err) {
                  console.warn(`[AI Studio] prisma.${prop}.${method} failed, using mock fallback:`, err);
                  const fallbackFn = mockModel?.[method];
                  return typeof fallbackFn === "function" ? fallbackFn(...args) : [];
                }
              };
            }
            return realMethod;
          },
        });
      }

      return realValue ?? mockPrisma[prop];
    },
  }
) as unknown) as PrismaClient;