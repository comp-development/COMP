<script>
    // Assume list of dictionaries passed as a prop or hardcoded for this example
    let dictionaries = [
        { key1: 'Value 1A', key2: 'Value 1B', key3: 'Value 1C' },
        { key1: 'Value 2A', key2: 'Value 2B', key3: 'Value 2C' },
        { key1: 'Value 3A', key2: 'Value 3B', key3: 'Value 3C' }
    ];

    // Move dictionary up in the list
    function moveUp(index) {
        if (index > 0) {
            const temp = dictionaries[index - 1];
            dictionaries[index - 1] = dictionaries[index];
            dictionaries[index] = temp;
        }
    }

    // Move dictionary down in the list
    function moveDown(index) {
        if (index < dictionaries.length - 1) {
            const temp = dictionaries[index + 1];
            dictionaries[index + 1] = dictionaries[index];
            dictionaries[index] = temp;
        }
    }
</script>

<style>
    .container {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }

    .box {
        border: 1px solid #ccc;
        padding: 10px;
        margin-left: 10px;
        flex-grow: 1;
    }

    .arrows {
        display: flex;
        flex-direction: column;
    }

    .arrow-button {
        padding: 5px;
        margin: 2px;
        cursor: pointer;
    }

    button {
        border: none;
        outline: none;
        background-color: none;
    }
</style>

<div>
    {#each dictionaries as dictionary, index}
        <div class="container">
            <div class="arrows">
                <button class="arrow-button" on:click={() => moveUp(index)} disabled={index === 0}>⬆️</button>
                <button class="arrow-button" on:click={() => moveDown(index)} disabled={index === dictionaries.length - 1}>⬇️</button>
            </div>
            <div class="box">
                {#each Object.entries(dictionary) as [key, value]}
                    <div><strong>{key}:</strong> {value}</div>
                {/each}
            </div>
        </div>
    {/each}
</div>
