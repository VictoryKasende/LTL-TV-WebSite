/** Pays proposés dans les formulaires publics (select "Votre pays"). */

const PRIORITY_COUNTRIES = [
  'République démocratique du Congo',
  'Congo-Brazzaville',
  'France',
  'Belgique',
  'Suisse',
  'Canada',
];

const OTHER_COUNTRIES = [
  'Afghanistan', 'Afrique du Sud', 'Albanie', 'Algérie', 'Allemagne', 'Andorre',
  'Angola', 'Arabie saoudite', 'Argentine', 'Arménie', 'Australie', 'Autriche',
  'Azerbaïdjan', 'Bahamas', 'Bahreïn', 'Bangladesh', 'Barbade', 'Bénin',
  'Bhoutan', 'Biélorussie', 'Birmanie', 'Bolivie', 'Bosnie-Herzégovine',
  'Botswana', 'Brésil', 'Brunei', 'Bulgarie', 'Burkina Faso', 'Burundi',
  'Cambodge', 'Cameroun', 'Cap-Vert', 'Chili', 'Chine', 'Chypre', 'Colombie',
  'Comores', 'Corée du Nord', 'Corée du Sud', 'Costa Rica', "Côte d'Ivoire",
  'Croatie', 'Cuba', 'Danemark', 'Djibouti', 'Égypte', 'Émirats arabes unis',
  'Équateur', 'Érythrée', 'Espagne', 'Estonie', 'Eswatini', 'États-Unis',
  'Éthiopie', 'Fidji', 'Finlande', 'Gabon', 'Gambie', 'Géorgie', 'Ghana',
  'Grèce', 'Grenade', 'Guatemala', 'Guinée', 'Guinée-Bissau',
  'Guinée équatoriale', 'Guyana', 'Haïti', 'Honduras', 'Hongrie', 'Inde',
  'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande', 'Israël', 'Italie',
  'Jamaïque', 'Japon', 'Jordanie', 'Kazakhstan', 'Kenya', 'Kirghizistan',
  'Kiribati', 'Kosovo', 'Koweït', 'Laos', 'Lesotho', 'Lettonie', 'Liban',
  'Liberia', 'Libye', 'Liechtenstein', 'Lituanie', 'Luxembourg', 'Macédoine du Nord',
  'Madagascar', 'Malaisie', 'Malawi', 'Maldives', 'Mali', 'Malte', 'Maroc',
  'Maurice', 'Mauritanie', 'Mexique', 'Moldavie', 'Monaco', 'Mongolie',
  'Monténégro', 'Mozambique', 'Namibie', 'Nauru', 'Népal', 'Nicaragua',
  'Niger', 'Nigeria', 'Norvège', 'Nouvelle-Zélande', 'Oman', 'Ouganda',
  'Ouzbékistan', 'Pakistan', 'Palaos', 'Palestine', 'Panama',
  'Papouasie-Nouvelle-Guinée', 'Paraguay', 'Pays-Bas', 'Pérou', 'Philippines',
  'Pologne', 'Portugal', 'Qatar', 'Roumanie', 'Royaume-Uni', 'Russie',
  'Rwanda', 'Saint-Marin', 'Sainte-Lucie', 'Salvador', 'Samoa',
  'Sao Tomé-et-Principe', 'Sénégal', 'Serbie', 'Seychelles', 'Sierra Leone',
  'Singapour', 'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Soudan du Sud',
  'Sri Lanka', 'Suède', 'Suriname', 'Syrie', 'Tadjikistan', 'Tanzanie',
  'Tchad', 'Tchéquie', 'Thaïlande', 'Timor oriental', 'Togo', 'Tonga',
  'Trinité-et-Tobago', 'Tunisie', 'Turkménistan', 'Turquie', 'Tuvalu',
  'Ukraine', 'Uruguay', 'Vanuatu', 'Vatican', 'Venezuela', 'Vietnam',
  'Yémen', 'Zambie', 'Zimbabwe',
];

export const COUNTRIES = [...PRIORITY_COUNTRIES, ...OTHER_COUNTRIES];
