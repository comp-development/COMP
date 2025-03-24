<script>
  import { page } from "$app/stores";
  import {getEventOrganizations, insertCoordinates} from "$lib/supabase";
  import { Map, TileLayer, Marker } from 'sveaflet';

  let coordinate_list = $state([]);
  const google_maps_key = import.meta.env.VITE_GOOGLE_MAPS_GEOCODING_KEY;
  async function get_coordinates(){
      let coordinate_array = new Array(0);
      let address; 
      let eventId = $page.params.event_id;
      let lat; let lng;
      let orgs = await getEventOrganizations(Number(eventId));
      for (let i = 0; i< orgs.length;  i++){
          console.log(orgs[i].org.address_longitude);
          if (orgs[i].org.address_longitude === null || orgs[i].org.address_latitude === null){
              console.log("this operations costs like .0005 cents");
              address = orgs[i].org.address;
              console.log(address);
              const result = await address_to_coordinates(address);
              [lat,lng] =  [result[0].geometry.location.lat, result[0].geometry.location.lng];
              insertCoordinates(orgs[i].org.org_id,lat,lng);
          }else{
              [lat,lng] = [orgs[i].org.address_latitude, orgs[i].org.address_longitude];
              console.log("WE DON'T USE API KEY YAY");
          }
          coordinate_array.push({latLng: [lat, lng]});
      }
      console.log(coordinate_array)
      coordinate_list = coordinate_array;
  }

  async function address_to_coordinates(address){
      console.log(google_maps_key);
      return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${google_maps_key}`)
      .then(response => response.json())
      .then(data => {
      console.log(data);
          console.log(data.results[0].geometry.location);
          return data.results;
      }).catch(error => {
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
          zoom: 1
      }}
  >
      <TileLayer url={'https://tile.openstreetmap.org/{z}/{x}/{y}.png'} />
      {#each coordinate_list as coordinates}
          <Marker latLng={coordinates.latLng} />
      {/each}
  </Map>
</div>
