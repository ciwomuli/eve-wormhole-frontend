import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.wormhole.title'),
    },
    name: 'Wormhole',
    path: '/wormhole',
    children: [
      {
        name: 'Submit',
        path: '/submit',
        component: () => import('#/views/wormhole/submit.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: $t('page.wormhole.submit'),
        },
      },
    ],
  },
];

export default routes;
