require('dotenv').config();

const { query } = require('./db');

const connectionString = process.env.DATABASE_URL;

const schema = `
CREATE TABLE items (
  id serial primary key,
  title varchar(128) not null,
  position int default 0,
  due timestamp with time zone,
  created timestamp with time zone not null default current_timestamp,
  updated timestamp with time zone not null default current_timestamp,
  completed boolean default false
);

INSERT INTO items (title, position, due, completed) VALUES ('Skrá í vefforritun 2', 1, null, true);
INSERT INTO items (title, position, due, completed) VALUES ('Sækja verkefni 4 á github', 2, null, false);
INSERT INTO items (title, position, due, completed) VALUES ('Klára verkefni 4', 3, null, false);
INSERT INTO items (title, position, due, completed) VALUES ('Setja verkefni 4 upp á Heroku', 4, null, false);
INSERT INTO items (title, position, due, completed) VALUES ('Skila verkefni 4', 5, '2019-03-08 23:59:59', false);
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
