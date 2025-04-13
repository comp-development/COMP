import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the Service Role key (Server-side only)
const supabase = createClient(
    "https://wnaiafhyzklyzeefxqmj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYWlhZmh5emtseXplZWZ4cW1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTAyMDAzMCwiZXhwIjoyMDU0NTk2MDMwfQ.WJtrr7tURLT3y_314B8uX2zKBsG4MozfQSqurIwM75I"
);

/**
 * Generates a magic link for the provided email
 * @param {string} email - The email to send the magic link to
 * @returns {Promise<{success: boolean, magicLink?: string, error?: any}>}
 */
async function generateMagicLink(email) {
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',  // Generates a magic link
        email: email
    });

    if (error) {
        console.error('Error generating magic link:', error);
        return { success: false, error };
    }

    // Access the link from the response data structure
    const magicLink = data?.properties?.action_link;
    console.log('Magic link generated:', magicLink);
    return { success: true, magicLink };
}

console.log("HI")
// Usage
generateMagicLink('kfrancis@forsythk12.org').then(response => {
    if (response.success) {
        console.log("Magic Link:", response.magicLink);
    }
});
