require('dotenv').config();

const { query } = require('./db');

const connectionString = process.env.DATABASE_URL;

const schema = `
CREATE TABLE items (
  id serial primary key,
  title varchar(128) not null,
  due timestamp with time zone,
  position int default 0,
  completed boolean default false,
  created timestamp with time zone not null default current_timestamp,
  updated timestamp with time zone not null default current_timestamp
);

INSERT INTO items (title, position, completed, due) VALUES ('Skrá í vefforritun 2', 1, true, null);
INSERT INTO items (title, position, completed, due) VALUES ('Sækja verkefni 4 á github', 2, false, null);
INSERT INTO items (title, position, completed, due) VALUES ('Klára verkefni 4', 3, false, null);
INSERT INTO items (title, position, completed, due) VALUES ('Setja verkefni 4 upp á Heroku', 4, false, null);
INSERT INTO items (title, position, completed, due) VALUES ('Skila verkefni 4', 5, false, '2019-03-08 23:59:59' );
`;

async function main() {
  console.info(`Set upp gagnagrunn á ${connectionString}`);
  // droppa töflu ef til
  await query('DROP TABLE IF EXISTS items');
  console.info('Töflu eytt');

  // búa til töflur út frá skema
  try {
    await query(schema);
    console.info('Tafla búin til');
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
