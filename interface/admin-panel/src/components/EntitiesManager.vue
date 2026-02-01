<template>
  <div class="entities-manager">
    <!-- Кнопка открытия менеджера -->
    <div class="manager-header">
      <button @click="openManager" class="btn-manage">
        📋 Управление элементами быстрого доступа
      </button>
    </div>

    <!-- Модальное окно -->
    <div v-if="showManager" class="modal-overlay" @click.self="closeManager">
      <div class="modal large-modal">
        <div class="modal-header">
          <h2>📋 Управление сущностями</h2>
          <button @click="closeManager" class="modal-close">×</button>
        </div>

        <div class="modal-body">
          <!-- Вкладки -->
          <div class="tabs">
            <button v-for="tab in tabs" :key="tab.id" :class="['tab-btn', { active: activeTab === tab.id }]"
              @click="switchTab(tab.id)">
              {{ tab.name }}
            </button>
          </div>

          <!-- Содержимое вкладок -->
          <div class="tab-content">
            <!-- Версии -->
            <div v-if="activeTab === 'versions'" class="entities-section">
              <div class="section-header">
                <h3>🎮 Версии Minecraft</h3>
                <button @click="refreshData('versions')" class="btn-refresh">
                  🔄 Обновить
                </button>
              </div>

              <div v-if="loading.versions" class="loading">Загрузка...</div>
              <div v-else-if="entities.versions.length === 0" class="empty-state">
                Нет версий. Добавьте через "Быстрое добавление".
              </div>
              <div v-else class="entities-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="version in entities.versions" :key="version.id">
                      <td class="entity-id">{{ truncateId(version.id) }}</td>
                      <td>
                        <span v-if="!version.editing">{{ version.title }}</span>
                        <input v-else v-model="version.editTitle" @keyup.enter="saveEdit('version', version)"
                          class="edit-input" />
                      </td>
                      <td class="entity-actions">
                        <button v-if="!version.editing" @click="startEdit(version)" class="btn-edit"
                          title="Редактировать">
                          ✏️
                        </button>
                        <button v-else @click="saveEdit('version', version)" class="btn-save" title="Сохранить">
                          💾
                        </button>
                        <button @click="deleteEntity('version', version.id, version.title)" class="btn-delete"
                          title="Удалить">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Загрузчики -->
            <div v-if="activeTab === 'modloaders'" class="entities-section">
              <div class="section-header">
                <h3>⚙️ Загрузчики модов</h3>
                <button @click="refreshData('modloaders')" class="btn-refresh">
                  🔄 Обновить
                </button>
              </div>

              <div v-if="loading.modloaders" class="loading">Загрузка...</div>
              <div v-else-if="entities.modloaders.length === 0" class="empty-state">
                Нет загрузчиков. Добавьте через "Быстрое добавление".
              </div>
              <div v-else class="entities-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="loader in entities.modloaders" :key="loader.id">
                      <td class="entity-id">{{ truncateId(loader.id) }}</td>
                      <td>
                        <span v-if="!loader.editing">{{ loader.title }}</span>
                        <input v-else v-model="loader.editTitle" @keyup.enter="saveEdit('modloader', loader)"
                          class="edit-input" />
                      </td>
                      <td class="entity-actions">
                        <button v-if="!loader.editing" @click="startEdit(loader)" class="btn-edit"
                          title="Редактировать">
                          ✏️
                        </button>
                        <button v-else @click="saveEdit('modloader', loader)" class="btn-save" title="Сохранить">
                          💾
                        </button>
                        <button @click="deleteEntity('modloader', loader.id, loader.title)" class="btn-delete"
                          title="Удалить">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Теги -->
            <div v-if="activeTab === 'tags'" class="entities-section">
              <div class="section-header">
                <h3>🏷️ Теги</h3>
                <button @click="refreshData('tags')" class="btn-refresh">
                  🔄 Обновить
                </button>
              </div>

              <div v-if="loading.tags" class="loading">Загрузка...</div>
              <div v-else-if="entities.tags.length === 0" class="empty-state">
                Нет тегов. Добавьте через "Быстрое добавление".
              </div>
              <div v-else class="entities-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="tag in entities.tags" :key="tag.id">
                      <td class="entity-id">{{ truncateId(tag.id) }}</td>
                      <td>
                        <span v-if="!tag.editing">{{ tag.title }}</span>
                        <input v-else v-model="tag.editTitle" @keyup.enter="saveEdit('tag', tag)" class="edit-input" />
                      </td>
                      <td class="entity-actions">
                        <button v-if="!tag.editing" @click="startEdit(tag)" class="btn-edit" title="Редактировать">
                          ✏️
                        </button>
                        <button v-else @click="saveEdit('tag', tag)" class="btn-save" title="Сохранить">
                          💾
                        </button>
                        <button @click="deleteEntity('tag', tag.id, tag.title)" class="btn-delete" title="Удалить">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Разработчики -->
            <div v-if="activeTab === 'developers'" class="entities-section">
              <div class="section-header">
                <h3>👨‍💻 Разработчики</h3>
                <button @click="refreshData('developers')" class="btn-refresh">
                  🔄 Обновить
                </button>
              </div>

              <div v-if="loading.developers" class="loading">Загрузка...</div>
              <div v-else-if="entities.developers.length === 0" class="empty-state">
                Нет разработчиков. Добавьте через "Быстрое добавление".
              </div>
              <div v-else class="entities-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Никнейм</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="dev in entities.developers" :key="dev.id">
                      <td class="entity-id">{{ truncateId(dev.id) }}</td>
                      <td>
                        <span v-if="!dev.editing">{{ dev.nickname }}</span>
                        <input v-else v-model="dev.editNickname" @keyup.enter="saveEdit('developer', dev)"
                          class="edit-input" />
                      </td>
                      <td class="entity-actions">
                        <button v-if="!dev.editing" @click="startEdit(dev)" class="btn-edit" title="Редактировать">
                          ✏️
                        </button>
                        <button v-else @click="saveEdit('developer', dev)" class="btn-save" title="Сохранить">
                          💾
                        </button>
                        <button @click="deleteEntity('developer', dev.id, dev.nickname)" class="btn-delete"
                          title="Удалить">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Сложности -->
            <div v-if="activeTab === 'difficulties'" class="entities-section">
              <div class="section-header">
                <h3>📊 Сложности</h3>
                <button @click="refreshData('difficulties')" class="btn-refresh">
                  🔄 Обновить
                </button>
              </div>

              <div v-if="loading.difficulties" class="loading">Загрузка...</div>
              <div v-else-if="entities.difficulties.length === 0" class="empty-state">
                Нет сложностей. Добавьте через "Быстрое добавление".
              </div>
              <div v-else class="entities-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="diff in entities.difficulties" :key="diff.id">
                      <td class="entity-id">{{ truncateId(diff.id) }}</td>
                      <td>
                        <span v-if="!diff.editing">{{ diff.title }}</span>
                        <input v-else v-model="diff.editTitle" @keyup.enter="saveEdit('difficulty', diff)"
                          class="edit-input" />
                      </td>
                      <td class="entity-actions">
                        <button v-if="!diff.editing" @click="startEdit(diff)" class="btn-edit" title="Редактировать">
                          ✏️
                        </button>
                        <button v-else @click="saveEdit('difficulty', diff)" class="btn-save" title="Сохранить">
                          💾
                        </button>
                        <button @click="deleteEntity('difficulty', diff.id, diff.title)" class="btn-delete"
                          title="Удалить">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Фокусы -->
            <div v-if="activeTab === 'focuses'" class="entities-section">
              <div class="section-header">
                <h3>🎯 Фокусы (направления)</h3>
                <button @click="refreshData('focuses')" class="btn-refresh">
                  🔄 Обновить
                </button>
              </div>

              <div v-if="loading.focuses" class="loading">Загрузка...</div>
              <div v-else-if="entities.focuses.length === 0" class="empty-state">
                Нет фокусов. Добавьте через "Быстрое добавление".
              </div>
              <div v-else class="entities-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="focus in entities.focuses" :key="focus.id">
                      <td class="entity-id">{{ truncateId(focus.id) }}</td>
                      <td>
                        <span v-if="!focus.editing">{{ focus.name }}</span>
                        <input v-else v-model="focus.editName" @keyup.enter="saveEdit('focus', focus)"
                          class="edit-input" />
                      </td>
                      <td class="entity-actions">
                        <button v-if="!focus.editing" @click="startEdit(focus)" class="btn-edit" title="Редактировать">
                          ✏️
                        </button>
                        <button v-else @click="saveEdit('focus', focus)" class="btn-save" title="Сохранить">
                          💾
                        </button>
                        <button @click="deleteEntity('focus', focus.id, focus.name)" class="btn-delete" title="Удалить">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Сообщения -->
          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeManager" class="btn-close">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { referencesApi, entitiesApi } from '../api.js'

export default {
  name: 'EntitiesManager',

  emits: ['entities-updated'],

  data() {
    return {
      showManager: false,
      activeTab: 'versions',

      // Вкладки
      tabs: [
        { id: 'versions', name: '🎮 Версии' },
        { id: 'modloaders', name: '⚙️ Загрузчики' },
        { id: 'tags', name: '🏷️ Теги' },
        { id: 'developers', name: '👨‍💻 Разработчики' },
        { id: 'difficulties', name: '📊 Сложности' },
        { id: 'focuses', name: '🎯 Фокусы' }
      ],

      // Сущности
      entities: {
        versions: [],
        modloaders: [],
        tags: [],
        developers: [],
        difficulties: [],
        focuses: []
      },

      // Загрузка
      loading: {
        versions: false,
        modloaders: false,
        tags: false,
        developers: false,
        difficulties: false,
        focuses: false
      },

      // Сообщения
      message: '',
      messageType: ''
    }
  },

  methods: {
    // Открыть менеджер
    openManager() {
      this.showManager = true
      this.loadAllData()
    },

    // Закрыть менеджер
    closeManager() {
      this.showManager = false
      this.message = ''
    },

    // Переключить вкладку
    switchTab(tabId) {
      this.activeTab = tabId
      this.refreshData(tabId)
    },

    // Загрузить все данные
    async loadAllData() {
      const entityTypes = ['versions', 'modloaders', 'tags', 'developers', 'difficulties', 'focuses']

      for (const type of entityTypes) {
        await this.refreshData(type)
      }
    },

    // Обновить данные конкретного типа
    async refreshData(type) {
      try {
        this.loading[type] = true

        let data
        switch (type) {
          case 'versions':
            data = await referencesApi.getVersions()
            this.entities.versions = data.map(item => ({
              ...item,
              editing: false,
              editTitle: item.title
            }))
            break

          case 'modloaders':
            data = await referencesApi.getModLoaders()
            this.entities.modloaders = data.map(item => ({
              ...item,
              editing: false,
              editTitle: item.title
            }))
            break

          case 'tags':
            data = await referencesApi.getTags()
            this.entities.tags = data.map(item => ({
              ...item,
              editing: false,
              editTitle: item.title
            }))
            break

          case 'developers':
            data = await referencesApi.getDevelopers()
            this.entities.developers = data.map(item => ({
              ...item,
              editing: false,
              editNickname: item.nickname
            }))
            break

          case 'difficulties':
            data = await referencesApi.getDifficulties()
            this.entities.difficulties = data.map(item => ({
              ...item,
              editing: false,
              editTitle: item.title
            }))
            break

          case 'focuses':
            data = await referencesApi.getFocuses()
            this.entities.focuses = data.map(item => ({
              ...item,
              editing: false,
              editName: item.name
            }))
            break
        }

      } catch (error) {
        console.error(`Ошибка загрузки ${type}:`, error)
        this.showMessage(`Ошибка загрузки ${this.getTypeName(type)}`, 'error')
      } finally {
        this.loading[type] = false
      }
    },

    // Начать редактирование
    startEdit(entity) {
      entity.editing = true
    },

    // Сохранить изменения
    async saveEdit(type, entity) {
      try {
        let updateData
        let apiMethod

        switch (type) {
          case 'version':
            updateData = { title: entity.editTitle }
            apiMethod = entitiesApi.updateVersion
            break

          case 'modloader':
            updateData = { title: entity.editTitle }
            apiMethod = entitiesApi.updateModLoader
            break

          case 'tag':
            updateData = { title: entity.editTitle }
            apiMethod = entitiesApi.updateTag
            break

          case 'developer':
            updateData = { nickname: entity.editNickname }
            apiMethod = entitiesApi.updateDeveloper
            break

          case 'difficulty':
            updateData = { title: entity.editTitle }
            apiMethod = entitiesApi.updateDifficulty
            break

          case 'focus':
            updateData = { name: entity.editName }
            apiMethod = entitiesApi.updateFocus
            break
        }

        await apiMethod(entity.id, updateData)

        // Обновляем отображаемое значение
        if (type === 'developer') {
          entity.nickname = entity.editNickname
        } else if (type === 'focus') {
          entity.name = entity.editName
        } else {
          entity.title = entity.editTitle
        }

        entity.editing = false
        this.showMessage(`${this.getTypeName(type)} успешно обновлен`, 'success')

        // Отправляем событие родителю
        this.$emit('entities-updated', { type, data: entity })

      } catch (error) {
        console.error(`Ошибка обновления ${type}:`, error)
        this.showMessage(`Ошибка обновления: ${error.message}`, 'error')
      }
    },

    // Удалить сущность
    async deleteEntity(type, id, name) {
      if (!confirm(`Удалить "${name}"?`)) return;

      try {
        // Удаляем через API
        switch (type) {
          case 'version': await entitiesApi.deleteVersion(id); break;
          case 'modloader': await entitiesApi.deleteModLoader(id); break;
          case 'tag': await entitiesApi.deleteTag(id); break;
          case 'developer': await entitiesApi.deleteDeveloper(id); break;
          case 'difficulty': await entitiesApi.deleteDifficulty(id); break;
          case 'focus': await entitiesApi.deleteFocus(id); break;
        }

        // Пытаемся удалить из массива, но не падаем при ошибке
        try {
          switch (type) {
            case 'version':
              if (this.entities.versions) this.entities.versions = this.entities.versions.filter(v => v.id !== id);
              break;
            case 'modloader':
              if (this.entities.modloaders) this.entities.modloaders = this.entities.modloaders.filter(m => m.id !== id);
              break;
            case 'tag':
              if (this.entities.tags) this.entities.tags = this.entities.tags.filter(t => t.id !== id);
              break;
            case 'developer':
              if (this.entities.developers) this.entities.developers = this.entities.developers.filter(d => d.id !== id);
              break;
            case 'difficulty':
              if (this.entities.difficulties) this.entities.difficulties = this.entities.difficulties.filter(d => d.id !== id);
              break;
            case 'focus':
              if (this.entities.focuses) this.entities.focuses = this.entities.focuses.filter(f => f.id !== id);
              break;
          }
        } catch (filterError) {
          console.warn('Ошибка фильтрации массива:', filterError);
          // Продолжаем выполнение, это не критично
        }

        this.showMessage(`${this.getTypeName(type)} "${name}" удален`, 'success');
        this.$emit('entities-updated', { type, action: 'delete', id });

      } catch (error) {
        console.error(`API ошибка удаления ${type}:`, error);

        // Если 404 или "не найдено" - сущность уже удалена, это не ошибка
        if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('не найдена')) {
          // Просто обновляем список
          await this.refreshData(this.activeTab);
          this.showMessage(`Элемент "${name}" уже удален`, 'info');
        } else {
          this.showMessage(`Ошибка удаления: ${error.message}`, 'error');
        }
      }
    },

    // Показать сообщение
    showMessage(text, type) {
      this.message = text
      this.messageType = type

      setTimeout(() => {
        this.message = ''
      }, 3000)
    },

    // Получить название типа
    getTypeName(type) {
      const names = {
        version: 'Версия',
        modloader: 'Загрузчик',
        tag: 'Тег',
        developer: 'Разработчик',
        difficulty: 'Сложность',
        focus: 'Фокус'
      }
      return names[type] || type
    },

    // Сократить ID для отображения
    truncateId(id) {
      if (!id) return ''
      return id.substring(0, 8) + '...'
    }
  }
}
</script>

<style scoped>
.entities-manager {
  margin: 20px 0;
}

.btn-manage {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-manage:hover {
  background: #8e44ad;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.large-modal {
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2c3e50;
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
  background: #f8f9fa;
}

/* Вкладки */
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 20px;
  border-bottom: 2px solid #ddd;
  padding-bottom: 10px;
}

.tab-btn {
  background: #f0f0f0;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #e0e0e0;
}

.tab-btn.active {
  background: #3498db;
  color: white;
}

/* Секции */
.entities-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-refresh {
  background: #3498db;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:hover {
  background: #2980b9;
}

/* Таблицы */
.entities-table {
  overflow-x: auto;
}

.entities-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.entities-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
}

.entities-table td {
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.entities-table tbody tr:hover {
  background: #f8f9fa;
}

.entity-id {
  font-family: monospace;
  font-size: 12px;
  color: #6c757d;
}

.entity-actions {
  white-space: nowrap;
  min-width: 120px;
}

.entity-actions button {
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  margin: 0 3px;
}

.btn-edit:hover {
  background: #fff3e0;
}

.btn-save {
  color: #2ecc71;
}

.btn-save:hover {
  background: #e8f5e9;
}

.btn-delete:hover {
  background: #ffebee;
}

.edit-input {
  width: 100%;
  padding: 6px 10px;
  border: 2px solid #3498db;
  border-radius: 4px;
  font-size: 14px;
}

.edit-input:focus {
  outline: none;
  border-color: #2980b9;
}

/* Состояния */
.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.message {
  padding: 12px;
  border-radius: 8px;
  margin: 15px 0;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Футер */
.modal-footer {
  padding: 15px 30px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

.btn-close {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-close:hover {
  background: #7f8c8d;
}

/* Адаптивность */
@media (max-width: 768px) {
  .large-modal {
    width: 95%;
    padding: 10px;
  }

  .tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
    text-align: left;
  }

  .entities-table {
    font-size: 12px;
  }

  .entity-actions {
    min-width: 100px;
  }

  .entity-actions button {
    padding: 4px 6px;
    margin: 0 2px;
  }
}
</style>