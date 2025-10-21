const stash = [];

export const bestMatch = ({ argArr, author, desc }) => {
  console.log("got to this file");
  const hasAuthorsName = [];
  const noAuthorsName = [];
  let name;
  let numberOfMatches = 0;
  console.log("AUTHOR: ", author);
  console.log("DESCRIPTION: ", desc);
  const descArr = desc.split(" ");

  for (let i of argArr) {
    if (i.toLowerCase().includes(author.toLowerCase().trim())) {
      hasAuthorsName.push(i);
    } else {
      noAuthorsName.push(i);
    }
  }

  if (hasAuthorsName.length) {
    for (let i of hasAuthorsName) {
      const nameArr = i.split(" ");
      const match = descArr.filter((word) => nameArr.includes(word));
      console.log("MATCH", match);
      if (match.length >= numberOfMatches && !stash.includes(i.trim())) {
        numberOfMatches = match.length;
        name = i;
      }
    }
  } else {
    for (let i of noAuthorsName) {
      const nameArr = i.split(" ");
      const match = descArr.filter((word) => nameArr.includes(word));
      console.log("MATCH", match);
      if (match.length > numberOfMatches && !stash.includes(i.trim())) {
        numberOfMatches = match.length;
        name = i;
      }
    }
  }

  stash.push(name.trim());
  console.log("Chosen Name: ", name);
  return name;
};
