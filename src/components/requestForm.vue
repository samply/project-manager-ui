<template>
  <div style="display: flex; flex-flow: column; height: 100vh">
    <div class="content container">
      <div id="newrequest-title" v-if="showTitle"><h1 >New Request</h1>
        <br/></div>

     <div  id="download-template" v-if="showTemplate" style="display: flex; justify-content: space-between">
       <label>Kein Antrag angefügt - Bitte füllen Sie diesen Antrag aus, um Ihren potenziellen Projektpartnern Ihr Projekt vorzustellen.</label>
       <button type="button" class="btn btn-primary">Vorlage herunterladen</button>
     </div>
      <div class="upload-section mb-4">
        <label for="fileInput" class="file-label">Datei auswählen</label>
        <br/>
        <input type="file" id="fileInput" @change="handleFileUpload" class="form-control-file" />
      </div>

      <div class="checkbox-section mb-4" >
        <input type="checkbox" id="cooperationPartner" v-model="cooperationPartner" style="margin-right:0.5%"/>
        <label for="cooperationPartner">Kooperationspartner bereits vorhanden</label>
      </div>

      <div class="input-section mb-4">
        <label for="projectTitle">Projekttitel</label>
        <input type="text" id="projectTitle" v-model="projectTitle" class="form-control" />
      </div>

      <div class="textarea-section mb-4">
        <label for="projectDescription">Projektbeschreibung</label>
        <textarea
            id="projectDescription"
            v-model="projectDescription"
            @input="updateCharacterCount"
            class="form-control"
            rows="5"
        ></textarea>
        <div class="character-count">Verbleibende Zeichen: {{ remainingCharacters }}</div>
      </div>

      <label>An folgende Standorte verteilen (Ihr Standort: Teststandort)</label>
      <div class="chips-box mb-4">
        <span v-for="(chip, index) in availableChips" :key="index" class="chip" @click="removeChip(index)">
  {{ chip }} &times;
</span>
      </div>

      <div id="submitButtons" v-if="showSubmitButtons" class="button-container d-flex justify-content-end" style="display: flex; gap:0.5%">
        <button type="button" class="btn btn-danger" @click="cancel">Abbrechen</button>
        <button type="button" class="btn btn-secondary" @click="saveCollaborationRequest">Speichern</button>
        <button type="button" class="btn btn-success" @click="sendCollaborationRequest">Kollaborationsanfrage versenden</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
    showSubmitButtons: {
      type: Boolean,
      default: true,
    },
    showTemplate: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      cooperationPartner: false,
      projectTitle: '',
      projectDescription: '',
      maxCharacters: 3000,
      remainingCharacters: 3000,
      selectedChips: [] as string[],
      file: null as File | null,
      availableChips: [
        'Berlin', 'Dresden', 'Düsseldorf', 'Essen', 'Frankfurt', 'Freiburg', 'Heidelberg',
        'Mainz', 'München(LMU)', 'München (TUM)', 'Tübingen', 'Teststandort', 'Köln', 'Ulm',
        'Bonn', 'Hamburg', 'Hannover', 'Würzburg', 'Mannheim'
      ],
    };
  },
  methods: {
    removeChip(index: number): void {
      const removedChip = this.availableChips.splice(index, 1)[0];
      console.log(`Chip entfernt: ${removedChip}`);
    },
    handleFileUpload(event: InputEvent) {
      console.log('File uploaded:', (event.target as HTMLInputElement).files?.[0]);
    },
    updateCharacterCount() {
      this.remainingCharacters = this.maxCharacters - this.projectDescription.length;
    },
    async sendCollaborationRequest() {
      try {
        const formData = new FormData();
        formData.append('cooperationPartner', String(this.cooperationPartner));
        formData.append('projectTitle', this.projectTitle);
        formData.append('projectDescription', this.projectDescription);
        formData.append('file', this.file as Blob);

        this.selectedChips.forEach((chip, index) => {
          formData.append(`chips[${index}]`, chip);
        });

        const response = await axios.post('BACKEND_API_ENDPOINT', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Antwort vom Backend:', response.data);
      } catch (error) {
        console.error('Fehler beim Senden der Anfrage:', error);
      }
    },

    async saveCollaborationRequest() {
      try {
        const formData = new FormData();
        formData.append('cooperationPartner', String(this.cooperationPartner));
        formData.append('projectTitle', this.projectTitle);
        formData.append('projectDescription', this.projectDescription);
        formData.append('file', this.file as Blob);

        this.selectedChips.forEach((chip, index) => {
          formData.append(`chips[${index}]`, chip);
        });

        const response = await axios.post('BACKEND_API_ENDPOINT', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Antwort vom Backend:', response.data);
      } catch (error) {
        console.error('Fehler beim Senden der Anfrage:', error);
      }
    },
  },
});
</script>

<style scoped>
.container {
  width: 100%;
  margin: 20px auto;
}

.chips-box {
  display: flex;
  flex-wrap: wrap;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
}

.chip {
  background-color: grey;
  color: #fff;
  border-radius: 4px;
  padding: 4px 8px;
  margin: 4px;
  cursor: pointer;
}

.file-label {
  margin-bottom: 0.5rem;
}

.file-input {
  display: none;
}

.button-container {
  margin-top: 1rem;
}

</style>
