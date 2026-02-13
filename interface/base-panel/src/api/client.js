import axios from 'axios'

const API_BASE = 'http://localhost:5126'

const client = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
})

// НЕ добавляем авторизацию - публичный доступ
export default client