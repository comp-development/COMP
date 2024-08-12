import { writable } from 'svelte/store';

let ini: any = "not loaded"
export const user = writable(ini);