export function createTimeStrings(
  publishedDate: string,
  lastEditedTime: string
) {
	// This is necessary because, confoundingly, JavaScript interprets 2023-11-02 as "midnight at November 2nd", and because
	// my timezone is UTC-4, the date it returns is actually November 1st at 8pm. Lord.
	const [ year, month, day ] = publishedDate.split("-")
	// We love a 0-indexed month
  const decoratedPublishedDate = new Date(Number(year), Number(month) - 1, Number(day));
  const formattedPublishedDate = `${decoratedPublishedDate.getMonth() + 1}/${
    decoratedPublishedDate.getDate()
  }/${decoratedPublishedDate.getFullYear()}`;

  const decoratedLastEditedTime = new Date(lastEditedTime);

  if (decoratedPublishedDate.toLocaleDateString() === decoratedLastEditedTime.toLocaleDateString()) {
    console.log("Same day");
    return { publishedString: formattedPublishedDate };
  } else {
    const formattedLastEditedTime = `${
      decoratedLastEditedTime.getMonth() + 1
    }/${decoratedLastEditedTime.getDate()}/${decoratedLastEditedTime.getFullYear()}`;
		return {
			publishedString: formattedPublishedDate,
			lastEditedString: formattedLastEditedTime,
		}
  }
}
