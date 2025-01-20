 <script lang="ts">
    import {
        DataTable
    } from "carbon-components-svelte";
    import {Papa} from "papaparse";

    function upload() {
        Papa.parse("onlinestudents.csv", {
            download: true, 
            skipEmptyLines: true,

            complete : csv => {
                var table = document.getElementById("table");
                table.innerHTML ="";

                for (let row of csv.data) {
                    let tr = table.insertRow();
                }
            }
        })
    }
</script>


<input type = "button" value = "uplaod csv" onclick={upload}>

<DataTable id = "table"></DataTable>