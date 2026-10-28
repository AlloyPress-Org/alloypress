import * as migration_20260918_120548_add_post_search_trigram from './20260918_120548_add_post_search_trigram';
import * as migration_20261017_051956_add_subscribers from './20261017_051956_add_subscribers';
import * as migration_20261026_090224_security_update_3_90 from './20261026_090224_security_update_3_90';
import * as migration_20261028_065612_add_push_fields from './20261028_065612_add_push_fields';

export const migrations = [
  {
    up: migration_20260918_120548_add_post_search_trigram.up,
    down: migration_20260918_120548_add_post_search_trigram.down,
    name: '20260918_120548_add_post_search_trigram',
  },
  {
    up: migration_20261017_051956_add_subscribers.up,
    down: migration_20261017_051956_add_subscribers.down,
    name: '20261017_051956_add_subscribers',
  },
  {
    up: migration_20261026_090224_security_update_3_90.up,
    down: migration_20261026_090224_security_update_3_90.down,
    name: '20261026_090224_security_update_3_90',
  },
  {
    up: migration_20261028_065612_add_push_fields.up,
    down: migration_20261028_065612_add_push_fields.down,
    name: '20261028_065612_add_push_fields'
  },
];
