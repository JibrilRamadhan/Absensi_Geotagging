<script setup>
import api from "@/api/axios";
import { onMounted, ref } from "vue";

const users = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    users.value = (await api.get("/api/admin/users/all")).data;
  } catch (e) {
    alert(e.message);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <h2>Data Siswa Magang</h2>

  <p v-if="loading">Loading...</p>

  <table v-else border="1">
    <thead>
      <tr>
        <th>Nama</th>
        <th>Email</th>
        <th>Perusahaan</th>
        <th>Status Hari Ini</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="u in users" :key="u.id">
        <td>{{ u.name }}</td>
        <td>{{ u.email }}</td>
        <td>{{ u.company_name }}</td>
        <td>
          <span v-if="u.status">
            {{ u.status }}
          </span>
          <span v-else>-</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
