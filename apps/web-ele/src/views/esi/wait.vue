<script lang="ts" setup>
import { reactive } from 'vue';

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
    const pair = var_.split('=');
    if (pair[0] === val) {
      return pair[1];
    }
  }

  return false;
}

submitCode(getQuery('code') as string, getQuery('state') as string)
  .then(() => {
    closeThis();
  })
  .catch((error: Error) => {
    ElMessageBox.alert((error as Error).message, {
      title: '操作',
      callback: () => {
        closeThis();
      },
    });
  });

function closeThis() {
  window.opener = null;
  window.open('', '_self');
  window.close();
}
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
