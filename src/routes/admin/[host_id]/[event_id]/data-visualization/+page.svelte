<script>
  import { page } from "$app/stores";
  import { getEventOrganizations } from "$lib/supabase";
  import { Map, TileLayer, Marker } from "sveaflet";

  let coordinate_list = $state([]);
  const google_maps_key = import.meta.env.VITE_GOOGLE_MAPS_GEOCODING_KEY;

  async function get_coordinates() {
    let coordinate_array = new Array(0);
    let address;
    let eventId = $page.params.event_id;
    let orgs = await getEventOrganizations(Number(eventId));
    for (let i = 0; i < orgs.length; i++) {
      address = orgs[i].org.address;
      const result = await address_to_coordinates(address);
      coordinate_array.push({
        latLng: [
          result[0].geometry.location.lat,
          result[0].geometry.location.lng,
        ],
      });
    }
    console.log(coordinate_array);
    coordinate_list = coordinate_array;
  }

  async function address_to_coordinates(address) {
    console.log(google_maps_key);
    return fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${google_maps_key}`,
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        console.log(data.results[0].geometry.location);
        return data.results;
      })
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  get_coordinates();
</script>

<div style="width:50%;height:250px;">
  <Map
    options={{
      center: [39.0119, -98.4842],
      zoom: 1,
    }}
  >
    <TileLayer url={"https://tile.openstreetmap.org/{z}/{x}/{y}.png"} />
    {#each coordinate_list as coordinates}
      <Marker latLng={coordinates.latLng} />
    {/each}
  </Map>
</div>
