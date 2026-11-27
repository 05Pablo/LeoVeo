// Carga datos de ejemplo: usuarios (incluido un admin), obras y reseñas.
// Uso:  npm run seed            (no hace nada si ya hay datos)
//       npm run seed -- --reset (borra todo y vuelve a cargar)
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Work = require('../src/models/Work');
const Review = require('../src/models/Review');

const USERS = [
  { username: 'admin', email: 'admin@leoveo.es', password: 'Admin1234', role: 'admin', bio: 'Administrador de LeoVeo.' },
  { username: 'lucia', email: 'lucia@leoveo.es', password: 'Lucia1234', role: 'user', bio: 'Cine de autor y novela negra.' },
  { username: 'marcos', email: 'marcos@leoveo.es', password: 'Marcos1234', role: 'user', bio: 'Ciencia ficción a todas horas.' },
];

const WORKS = [
  { title: 'Dune', type: 'libro', creator: 'Frank Herbert', year: 1965, genres: ['ciencia ficción', 'aventura'], synopsis: 'Paul Atreides llega a Arrakis, el planeta desierto del que depende todo el universo conocido.' },
  { title: 'Cien años de soledad', type: 'libro', creator: 'Gabriel García Márquez', year: 1967, genres: ['realismo mágico', 'drama'], synopsis: 'La historia de la familia Buendía a lo largo de siete generaciones en Macondo.' },
  { title: 'El nombre de la rosa', type: 'libro', creator: 'Umberto Eco', year: 1980, genres: ['misterio', 'histórica'], synopsis: 'Una serie de muertes en una abadía benedictina del siglo XIV.' },
  { title: 'La sombra del viento', type: 'libro', creator: 'Carlos Ruiz Zafón', year: 2001, genres: ['misterio', 'drama'], synopsis: 'Daniel descubre un libro maldito en el Cementerio de los Libros Olvidados.' },
  { title: 'Fahrenheit 451', type: 'libro', creator: 'Ray Bradbury', year: 1953, genres: ['ciencia ficción', 'distopía'], synopsis: 'En un futuro donde los libros están prohibidos, un bombero empieza a dudar.' },
  { title: 'El laberinto del fauno', type: 'pelicula', creator: 'Guillermo del Toro', year: 2006, genres: ['fantasía', 'drama'], synopsis: 'España, 1944. Ofelia descubre un laberinto habitado por un fauno.' },
  { title: 'Interstellar', type: 'pelicula', creator: 'Christopher Nolan', year: 2014, genres: ['ciencia ficción', 'drama'], synopsis: 'Un grupo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar.' },
  { title: 'Parásitos', type: 'pelicula', creator: 'Bong Joon-ho', year: 2019, genres: ['thriller', 'drama'], synopsis: 'Una familia pobre se infiltra poco a poco en la vida de una familia rica.' },
  { title: 'El viaje de Chihiro', type: 'pelicula', creator: 'Hayao Miyazaki', year: 2001, genres: ['animación', 'fantasía'], synopsis: 'Chihiro queda atrapada en un mundo de espíritus y debe salvar a sus padres.' },
  { title: 'Mar adentro', type: 'pelicula', creator: 'Alejandro Amenábar', year: 2004, genres: ['drama'], synopsis: 'La lucha de Ramón Sampedro por decidir sobre su propia vida.' },
];

const REVIEWS = [
  ['lucia', 'Cien años de soledad', 5, 'Una obra maestra', 'Cada página es una sorpresa. La prosa de García Márquez es hipnótica.'],
  ['marcos', 'Dune', 5, 'La biblia de la ciencia ficción', 'Política, ecología y religión en un mismo libro. Imprescindible.'],
  ['lucia', 'Dune', 4, 'Exigente pero merece la pena', 'Cuesta entrar en el universo, pero luego no puedes soltarlo.'],
  ['marcos', 'Interstellar', 5, 'Emoción y física', 'La banda sonora y la escena del muelle son inolvidables.'],
  ['lucia', 'Parásitos', 5, 'Brillante de principio a fin', 'Cambia de género tres veces sin que se note. Una crítica social afiladísima.'],
  ['admin', 'El laberinto del fauno', 4, 'Cuento oscuro', 'Fantasía y posguerra mezcladas con mucha sensibilidad.'],
  ['marcos', 'Fahrenheit 451', 3, 'Idea genial, ritmo irregular', 'La premisa sigue siendo muy actual aunque el final se me hizo apresurado.'],
  ['lucia', 'La sombra del viento', 4, 'Barcelona en estado puro', 'Atmósfera gótica y un misterio que engancha desde el primer capítulo.'],
  ['admin', 'El viaje de Chihiro', 5, 'Magia pura', 'Una película para cualquier edad. Cada fotograma es una ilustración.'],
];

async function seed() {
  await connectDB();
  const reset = process.argv.includes('--reset');

  if (reset) {
    await Promise.all([User.deleteMany({}), Work.deleteMany({}), Review.deleteMany({})]);
    console.log('[seed] Colecciones vaciadas');
  } else if (await User.estimatedDocumentCount()) {
    console.log('[seed] Ya hay datos. Usa "npm run seed -- --reset" para recargarlos.');
    return;
  }

  const users = {};
  for (const u of USERS) {
    const passwordHash = await User.hashPassword(u.password, env.BCRYPT_ROUNDS);
    users[u.username] = await User.create({ username: u.username, email: u.email, role: u.role, bio: u.bio, passwordHash });
  }

  const works = {};
  for (const [i, w] of WORKS.entries()) {
    const creator = i % 2 === 0 ? users.lucia : users.marcos;
    works[w.title] = await Work.create({ ...w, createdBy: creator._id });
  }

  for (const [username, title, rating, rTitle, body] of REVIEWS) {
    await Review.create({ author: users[username]._id, work: works[title]._id, rating, title: rTitle, body });
  }
  for (const w of Object.values(works)) await Review.recalculateWorkStats(w._id);

  console.log(`[seed] ${USERS.length} usuarios, ${WORKS.length} obras y ${REVIEWS.length} reseñas creadas`);
  console.log('[seed] Admin: admin@leoveo.es / Admin1234  ·  Usuario: lucia@leoveo.es / Lucia1234');
}

seed()
  .catch((err) => {
    console.error('[seed] Error:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
