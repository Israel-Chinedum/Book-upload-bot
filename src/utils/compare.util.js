export const bestMatch = (argArr, value) => {
  let name;
  let numberOfMatches = 0;
  const valArr = value.split(" ");
  for (let i of argArr) {
    const nameArr = i.split(" ");
    const match = valArr.filter((val) => nameArr.includes(val));
    if (match.length > numberOfMatches) {
      numberOfMatches = match.length;
      name = i;
    }
  }
  return name;
};
