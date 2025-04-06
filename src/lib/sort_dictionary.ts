export function rearrangeItems(data) {
  const order = {"surface": 1, "edge": 2, "point": 3, "text": 4};

  // Function to get the order of an item
  function getOrder(item) {
      return order[item.type] || Infinity; // If type not found, put it at the end
  }

  // Sort the array of dictionaries based on the order defined
  data.sort((a, b) => getOrder(a) - getOrder(b));

  return data;
}
