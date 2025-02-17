<script>
    import { page } from "$app/stores";
    import { debug_log } from "$lib/logger";
    import {getEventOrganizations} from "$lib/supabase";
	import { Map, TileLayer, Popup, Marker } from 'sveaflet';

    let loaded = false;
    let coordinate_list;
    const google_maps_key = import.meta.env.VITE_GOOGLE_MAPS_GEOCODING_KEY;
    let a = $state();
    async function print_addresses(){
        let s = "";
        let eventId = $page.params.event_id;
        let orgs = await getEventOrganizations(Number(eventId));
        for (let i = 0; i< orgs.length;  i++){
            s += orgs[i].org.address + "\n";
            
        }
        a = s;
    }
    // onMount(async () => {
    //     setTimeout(() => {
    //         loaded = true;
    //     }, 3000);
    // });

    async function get_coordinates(){
        let coordinate_array = new Array(0);
        let address; 
        let eventId = $page.params.event_id;
        let orgs = await getEventOrganizations(Number(eventId));
        for (let i = 0; i< orgs.length;  i++){
            address = orgs[i].org.address;
            coordinate_array.push(await address_to_coordinates(address));
        }
        return coordinate_array;
    }

    async function address_to_coordinates(address){
        console.log(google_maps_key);
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${google_maps_key}`)
        .then(response => response.json())
        .then(data => {
		    console.log(data);
            return data.geometry.location;
        }).catch(error => {
            console.log(error);
            return [];
        });
    }
    print_addresses();
    get_coordinates();
</script>

<div style="width:50%;height:250px;">
    <Map
        options={{
            center: [51.505, -0.09],
            zoom: 13
        }}
    >
        <TileLayer url={'https://tile.openstreetmap.org/{z}/{x}/{y}.png'} />
        <Marker latLng={[51.505, -0.09]} />
    </Map>
</div>
<div>
    {a}
</div>
