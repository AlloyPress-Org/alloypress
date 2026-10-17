import * as migration_20260918_120548_add_post_search_trigram from './20260918_120548_add_post_search_trigram';
import * as migration_20261017_051956_add_subscribers from './20261017_051956_add_subscribers';

export const migrations = [
  {
    up: migration_20260918_120548_add_post_search_trigram.up,
    down: migration_20260918_120548_add_post_search_trigram.down,
    name: '20260918_120548_add_post_search_trigram',
  },
  {
    up: migration_20261017_051956_add_subscribers.up,
    down: migration_20261017_051956_add_subscribers.down,
    name: '20261017_051956_add_subscribers'
  },
];
