<script setup lang="ts">
import { ref } from 'vue'
import { useApp } from '@/composables/useApp'
import { loadConfig, saveConfig } from '@/config'
import type { AppConfig } from '@/types'

defineEmits<{ close: [] }>()

const app = useApp()
const config = ref<AppConfig>(loadConfig())
const saved = ref(false)

function save() {
  saveConfig(config.value)
  app.reloadProvider()
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}
</script>

<template>
  <div class="settings-panel">
    <h2 class="panel-title">设置</h2>

    <div class="panel-body">
      <!-- Provider -->
      <div class="field">
        <label class="field-label">AI 提供商</label>
        <select v-model="config.provider" class="select-input">
          <option value="deepseek">Deepseek</option>
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
        </select>
      </div>

      <hr class="divider" />

      <!-- Deepseek -->
      <div v-if="config.provider === 'deepseek'" class="fields-group">
        <div class="field">
          <label class="field-label">API Key</label>
          <input v-model="config.deepseek.apiKey" type="password" placeholder="sk-..." class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">API 地址</label>
          <input v-model="config.deepseek.baseUrl" class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">模型</label>
          <input v-model="config.deepseek.model" class="text-input" />
        </div>
      </div>

      <!-- OpenAI -->
      <div v-if="config.provider === 'openai'" class="fields-group">
        <div class="field">
          <label class="field-label">API Key</label>
          <input v-model="config.openai.apiKey" type="password" placeholder="sk-..." class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">API 地址</label>
          <input v-model="config.openai.baseUrl" class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">模型</label>
          <input v-model="config.openai.model" class="text-input" />
        </div>
      </div>

      <!-- Claude -->
      <div v-if="config.provider === 'claude'" class="fields-group">
        <div class="field">
          <label class="field-label">API Key</label>
          <input v-model="config.claude.apiKey" type="password" placeholder="sk-ant-..." class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">API 地址</label>
          <input v-model="config.claude.baseUrl" class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">模型</label>
          <input v-model="config.claude.model" class="text-input" />
        </div>
      </div>

      <hr class="divider" />

      <!-- Embedding -->
      <div class="field">
        <label class="field-label">向量化模型（用于语义记忆）</label>
        <select v-model="config.embedding.provider" class="select-input">
          <option value="">不启用</option>
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="dashscope">阿里云 DashScope</option>
        </select>
      </div>

      <div v-if="config.embedding.provider" class="fields-group">
        <div class="field">
          <label class="field-label">API Key</label>
          <input v-model="config.embedding.apiKey" type="password" placeholder="sk-..." class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">API 地址</label>
          <input v-model="config.embedding.baseUrl" class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">模型</label>
          <input v-model="config.embedding.model" class="text-input" />
        </div>
      </div>

      <hr class="divider" />

      <button class="save-btn" @click="save">
        {{ saved ? '已保存 ✓' : '保存' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  padding: 28px 28px 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.text-input,
.select-input {
  width: 100%;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.text-input:focus,
.select-input:focus {
  border-color: #9ca3af;
}

.text-input::placeholder {
  color: #d1d5db;
}

.fields-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.divider {
  border: none;
  border-top: 1px solid #f3f4f6;
}

.save-btn {
  width: 100%;
  padding: 10px;
  background: #111827;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.save-btn:hover {
  background: #1f2937;
}
</style>
