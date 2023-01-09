import axios from 'axios';

export type TextName = 'termsAndConditions' | 'imprint' | 'privacyPolicy' | 'baurecht'


export async function fetchText(name: TextName): Promise<string> {
  const response = await axios.get<string>(`/api/texts/${name}`)

  return response.data
}

export async function updateText(name: TextName, text: string): Promise<any> {
  return axios.put<string>(`/api/texts/${name}`, text)
}
