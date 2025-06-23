<script lang="ts" setup>
import { reactive } from 'vue';

import { useAccessStore } from '@vben/stores';

import { ElMessageBox } from 'element-plus';

import { submitCode } from '#/api';

const compState = reactive({
  absolute: false,
  loading: true,
  tip: '登录完成,正在更新角色数据 请不要退出...',
});

function getQuery(val: string | undefined) {
  const w = location.href.indexOf('?');
  const query = location.href.slice(Math.max(0, w + 1));
  const vars = query.split('&');
  for (const var_ of vars) {
    const idx = var_.indexOf('=');
    if (idx !== -1) {
      const key = var_.slice(0, idx);
      const value = var_.slice(idx + 1);
      if (key === val) {
        return decodeURIComponent(value);
      }
    }
  }

  return false;
}
const accessStore = useAccessStore();
/* ElMessageBox.alert(String(accessStore.getAccessToken() ?? ''), {
  title: '操作',
  callback: () => {
    closeThis();
  },
});
*/
submitCode(getQuery('code') as string, getQuery('state') as string)
  .then((res) => {
    accessStore.setAccessToken(res.token);
    window.location.href = '/dashboard';
  })
  .catch((error: Error) => {
    ElMessageBox.alert(error.message, {
      title: '操作',
      callback: () => {
        window.location.href = '/auth/login';
      },
    });
  });
</script>

<template>
  <div>
    <ElLoading
      :loading="compState.loading"
      :absolute="compState.absolute"
      :tip="compState.tip"
    />
  </div>
</template>
