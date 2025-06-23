<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { useI18n } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// 初始化国际化
const { t } = useI18n();

// 定义类型
interface WormholeData {
  wormholeId: string;
  sourceSignal: string;
  sourceSystem: string;
  targetSignal: string;
  targetSystem: string;
  massStatus: string;
  timeStatus: string;
  submitTime?: string;
  earliestDisappearTime?: string;
  latestDisappearTime?: string;
}

interface StatusOption {
  value: string;
  label: string;
}

// 定义表单数据
const formData = reactive<WormholeData>({
  wormholeId: '',
  sourceSignal: '',
  targetSignal: '',
  sourceSystem: '',
  targetSystem: '',
  massStatus: '',
  timeStatus: '',
});

// 定义下拉选项
const massStatusOptions: StatusOption[] = [
  { value: 'stable', label: t('wormhole.submit.massStatus.stable') },
  { value: 'destab', label: t('wormhole.submit.massStatus.destab') },
  { value: 'critical', label: t('wormhole.submit.massStatus.critical') },
];

const timeStatusOptions: StatusOption[] = [
  { value: 'stable', label: t('wormhole.submit.timeStatus.stable') },
  { value: 'end-of-life', label: t('wormhole.submit.timeStatus.endOfLife') },
];

// 表格数据
const tableData = ref<WormholeData[]>([
  {
    wormholeId: 'K162',
    sourceSignal: 'ABC-123',
    sourceSystem: 'Jita',
    targetSignal: 'XYZ-456',
    targetSystem: 'Amarr',
    massStatus: 'stable',
    timeStatus: 'stable',
    submitTime: '2025/6/22 14:30:45',
    earliestDisappearTime: '2025/6/23 14:30:45',
    latestDisappearTime: '2025/6/24 14:30:45',
  },
  {
    wormholeId: 'C247',
    sourceSignal: 'DEF-789',
    sourceSystem: 'Dodixie',
    targetSignal: 'GHI-101',
    targetSystem: 'Hek',
    massStatus: 'destab',
    timeStatus: 'end-of-life',
    submitTime: '2025/6/22 18:15:22',
    earliestDisappearTime: '2025/6/23 18:15:22',
    latestDisappearTime: '2025/6/24 18:15:22',
  },
  {
    wormholeId: 'B274',
    sourceSignal: 'JKL-202',
    sourceSystem: '未知星系',
    targetSignal: 'MNO-303',
    targetSystem: '未知星系',
    massStatus: 'critical',
    timeStatus: 'stable',
    submitTime: '2025/6/23 09:05:11',
    earliestDisappearTime: '2025/6/24 09:05:11',
    latestDisappearTime: '2025/6/25 09:05:11',
  },
]);

// 表单引用
const formRef = ref();

// 提交表单
function submitForm() {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      // 计算最早和最晚消失时间（实际应该根据具体规则计算）
      const now = new Date();
      const earliestDisappearTime = new Date(
        now.getTime() + 24 * 60 * 60 * 1000,
      ); // 示例：24小时后
      const latestDisappearTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 示例：48小时后

      // 添加到表格
      tableData.value.push({
        ...formData,
        earliestDisappearTime: earliestDisappearTime.toLocaleString(),
        latestDisappearTime: latestDisappearTime.toLocaleString(),
        submitTime: now.toLocaleString(),
      });

      ElMessage.success(t('wormhole.submit.form.message.success'));

      // 清空表单
      resetForm();
    } else {
      ElMessage.error(t('wormhole.submit.form.message.error'));
    }
  });
}

// 重置表单
function resetForm() {
  formRef.value.resetFields();
  formData.sourceSystem = '';
  formData.targetSystem = '';
}

// 表单验证规则
const rules = {
  wormholeId: [
    {
      required: true,
      message: t('wormhole.submit.form.validation.wormholeIdRequired'),
      trigger: 'blur',
    },
  ],
  sourceSignal: [
    {
      required: true,
      message: t('wormhole.submit.form.validation.sourceSignalRequired'),
      trigger: 'blur',
    },
  ],
  targetSignal: [
    {
      required: true,
      message: t('wormhole.submit.form.validation.targetSignalRequired'),
      trigger: 'blur',
    },
  ],
  massStatus: [
    {
      required: true,
      message: t('wormhole.submit.form.validation.massStatusRequired'),
      trigger: 'change',
    },
  ],
  timeStatus: [
    {
      required: true,
      message: t('wormhole.submit.form.validation.timeStatusRequired'),
      trigger: 'change',
    },
  ],
};

// 获取质量状态和时间状态的标签
function getStatusLabel(value: string, options: StatusOption[]) {
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : value;
}

// WebSocket 连接管理
let ws: null | WebSocket = null;
const wsConnected = ref(false);

// 创建 WebSocket 连接
function createWebSocketConnection() {
  if (ws) return; // 避免重复连接

  // 获取当前网站基础URL，确保WebSocket协议匹配
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const accessStore = useAccessStore();
  const accessToken = `Bearer ${accessStore.getAccessToken()}`;
  // 获取当前网站域名和端口

  const wsUrl = `ws://127.0.0.1:5777/api/wormhole/ws`;

  try {
    // 创建 WebSocket 连接
    ws = new WebSocket(wsUrl);

    // 使用 addEventListener 而不是 onopen
    ws.addEventListener('open', () => {
      wsConnected.value = true;
      ws?.send(
        JSON.stringify({
          Authorization: accessToken,
        }),
      );
    });

    // 使用 addEventListener 而不是 onmessage
    ws.addEventListener('message', (event) => {
      try {
        // const _data = JSON.parse(event.data);
        // 这里可以处理收到的消息，比如更新表格数据
        const data = JSON.parse(event.data);
        if (data.type !== 'wormhole') {
          return; // 只处理 wormhole 类型的消息
        }
        formData.sourceSystem = data.fromSystemName || '';
        formData.targetSystem = data.toSystemName || '';
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    });

    // 使用 addEventListener 而不是 onclose
    ws.addEventListener('close', () => {
      wsConnected.value = false;
      ws = null;
    });

    // 使用 addEventListener 而不是 onerror
    ws.addEventListener('error', (error) => {
      console.error('WebSocket 错误:', error);
      wsConnected.value = false;
    });
  } catch (error) {
    console.error('创建WebSocket连接失败:', error);
  }
}

// 关闭 WebSocket 连接
function closeWebSocketConnection() {
  if (
    ws &&
    (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)
  ) {
    ws.close();
    ws = null;
    wsConnected.value = false;
  }
}

// 处理页面可见性变化
function handleVisibilityChange() {
  if (!document.hidden && !ws) {
    // 页面重新可见且连接已关闭时，重新连接
    createWebSocketConnection();
  }
}

// 处理页面关闭事件
function handleBeforeUnload() {
  // 只有在页面关闭时才关闭WebSocket连接
  closeWebSocketConnection();
}

// 在组件挂载时建立连接，并添加事件监听
onMounted(() => {
  createWebSocketConnection();
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// 在组件卸载时关闭连接，并移除监听器
onUnmounted(() => {
  closeWebSocketConnection();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <Page
    :title="t('wormhole.submit.pageTitle')"
    :description="t('wormhole.submit.pageDescription')"
  >
    <div class="flex flex-col gap-6">
      <!-- 上半部分：提交表单 -->
      <ElCard class="w-full">
        <template #header>
          <div class="font-bold">{{ t('wormhole.submit.formTitle') }}</div>
        </template>

        <ElForm
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="80px"
          label-position="top"
          class="mx-auto max-w-full"
        >
          <!-- 单行表单 -->
          <div class="grid grid-cols-7 gap-2">
            <ElFormItem
              :label="t('wormhole.submit.form.wormholeId')"
              prop="wormholeId"
              class="col-span-1"
            >
              <ElInput
                v-model="formData.wormholeId"
                :placeholder="t('wormhole.submit.form.wormholeIdPlaceholder')"
                size="small"
              />
            </ElFormItem>

            <ElFormItem
              :label="t('wormhole.submit.form.sourceSignal')"
              prop="sourceSignal"
              class="col-span-1"
            >
              <ElInput
                v-model="formData.sourceSignal"
                :placeholder="t('wormhole.submit.form.sourceSignalPlaceholder')"
                size="small"
              />
            </ElFormItem>

            <ElFormItem
              :label="t('wormhole.submit.form.sourceSystem')"
              class="col-span-1"
            >
              <ElInput
                v-model="formData.sourceSystem"
                disabled
                :placeholder="t('wormhole.submit.form.sourceSystemPlaceholder')"
                size="small"
              />
            </ElFormItem>

            <ElFormItem
              :label="t('wormhole.submit.form.targetSignal')"
              prop="targetSignal"
              class="col-span-1"
            >
              <ElInput
                v-model="formData.targetSignal"
                :placeholder="t('wormhole.submit.form.targetSignalPlaceholder')"
                size="small"
              />
            </ElFormItem>

            <ElFormItem
              :label="t('wormhole.submit.form.targetSystem')"
              class="col-span-1"
            >
              <ElInput
                v-model="formData.targetSystem"
                disabled
                :placeholder="t('wormhole.submit.form.targetSystemPlaceholder')"
                size="small"
              />
            </ElFormItem>

            <ElFormItem
              :label="t('wormhole.submit.form.massStatus')"
              prop="massStatus"
              class="col-span-1"
            >
              <ElSelect
                v-model="formData.massStatus"
                :placeholder="t('wormhole.submit.form.massStatusPlaceholder')"
                class="w-full"
                size="small"
              >
                <ElOption
                  v-for="item in massStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem
              :label="t('wormhole.submit.form.timeStatus')"
              prop="timeStatus"
              class="col-span-1"
            >
              <ElSelect
                v-model="formData.timeStatus"
                :placeholder="t('wormhole.submit.form.timeStatusPlaceholder')"
                class="w-full"
                size="small"
              >
                <ElOption
                  v-for="item in timeStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </div>

          <!-- 按钮行 -->
          <div class="mt-2 flex justify-end">
            <ElButton type="primary" size="small" @click="submitForm">
              {{ t('wormhole.submit.form.submit') }}
            </ElButton>
            <ElButton class="ml-2" size="small" @click="resetForm">
              {{ t('wormhole.submit.form.reset') }}
            </ElButton>
          </div>
        </ElForm>
      </ElCard>

      <ElDivider />

      <!-- 下半部分：数据表格 -->
      <ElCard class="w-full">
        <template #header>
          <div class="font-bold">{{ t('wormhole.submit.tableTitle') }}</div>
        </template>

        <ElTable :data="tableData" stripe border style="width: 100%">
          <ElTableColumn
            prop="wormholeId"
            :label="t('wormhole.submit.table.wormholeId')"
            width="100"
          />
          <ElTableColumn
            prop="sourceSignal"
            :label="t('wormhole.submit.table.sourceSignal')"
            width="120"
          />
          <ElTableColumn
            prop="sourceSystem"
            :label="t('wormhole.submit.table.sourceSystem')"
            width="120"
          />
          <ElTableColumn
            prop="targetSignal"
            :label="t('wormhole.submit.table.targetSignal')"
            width="120"
          />
          <ElTableColumn
            prop="targetSystem"
            :label="t('wormhole.submit.table.targetSystem')"
            width="120"
          />
          <ElTableColumn
            :label="t('wormhole.submit.table.massStatus')"
            width="100"
          >
            <template #default="scope">
              {{ getStatusLabel(scope.row.massStatus, massStatusOptions) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            :label="t('wormhole.submit.table.timeStatus')"
            width="100"
          >
            <template #default="scope">
              {{ getStatusLabel(scope.row.timeStatus, timeStatusOptions) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            prop="submitTime"
            :label="t('wormhole.submit.table.submitTime')"
            width="180"
          />
          <ElTableColumn
            prop="earliestDisappearTime"
            :label="t('wormhole.submit.table.earliestDisappearTime')"
            width="180"
          />
          <ElTableColumn
            prop="latestDisappearTime"
            :label="t('wormhole.submit.table.latestDisappearTime')"
            width="180"
          />
        </ElTable>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
.el-card {
  margin-bottom: 16px;
}

/* 增大表单内输入框的字体 */
:deep(.el-input__inner),
:deep(.el-select__wrapper) {
  font-size: 14px !important;
}

/* 调整下拉选项的字体大小 */
:deep(.el-select-dropdown__item) {
  font-size: 14px !important;
}

/* 增强表单标签的可读性 */
:deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 500;
}
</style>
