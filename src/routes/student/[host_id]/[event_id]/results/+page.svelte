<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabaseClient';

    let host_id = $page.params.host_id;
    let event_id = $page.params.event_id;

    onMount(async () => {
        try {
            // Get current user's ID
            const { data: { user } } = await supabase.auth.getUser();
            const student_id = user?.id;

            if (student_id) {
                // First insert the basic record
                const { data: insertedData, error: insertError } = await supabase
                    .from('suspected_cheaters')
                    .insert({
                        student_id,
                        event_id: parseInt(event_id),
                        reason: 'Leaked Tests'
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error inserting into suspected_cheaters:', insertError);
                    return;
                }

                // Then get IP address and update the record
                const response = await fetch('https://api.ipify.org?format=json');
                const ipData = await response.json();
                const ipAddress = ipData.ip;

                // Update the record with IP address
                const { error: updateError } = await supabase
                    .from('suspected_cheaters')
                    .update({
                        metadata: {
                            IP_address: ipAddress
                        }
                    })
                    .eq('id', insertedData.id);

                if (updateError) {
                    console.error('Error updating suspected_cheaters:', updateError);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
</script>

<div class="container mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-md p-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Results Unavailable</h1>
        <p class="text-gray-600">
            Results are not made available by the event.
        </p>
    </div>
</div>
