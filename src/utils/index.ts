import { ListRequest } from '@/types/types';

export { default as toThousands } from './toThousands';
export { default as highlightValue } from './highlightValue';
export { default as formatValue } from './formatValue';

export const fromCamelCaseToDBName = word => {
  let final = '';
  for (const char of word) {
    if (char === char.toUpperCase()) {
      final += '_' + char.toLowerCase();
    } else {
      final += char;
    }
  }
  return final;
};

export const fromListRequestToQueryParams = listRequest => {
  let final = '';
  final += `&pageNumber=${listRequest.pageNumber}`;
  final += `&pageSize=${listRequest.pageSize}`;
  final += `&sortBy=${fromCamelCaseToDBName(listRequest.sortBy)}`;
  final += `&sortType=${listRequest.sortType}`;
  final += `&filterLogic=${listRequest.filterLogic}`;

  // construct a parsable filter query param from fitlers array
  let filtersString = '';
  listRequest.filters.map((filter, i) => {
    filtersString += `${filter.fieldName},${filter.operator},${filter.value}`;
    if (i + 1 < listRequest.filters.length) {
      filtersString += '_fspr_';
    }
  });

  if (filtersString.length > 0) final += `&filters=${filtersString}`;

  if (listRequest.ignore) final += `&ignore=true`;
  if (listRequest.skipDetails) final += `&skipDetails=true`;
  return final;
};

export const addFilterToListRequest = (
  fieldName: string,
  operator: string,
  value: string,
  listRequest: ListRequest
) => {
  const filters = [...listRequest.filters];

  // Check if a filter with the same fieldName already exists
  const existingFilterIndex = filters.findIndex(filter => filter.fieldName === fieldName);

  if (existingFilterIndex !== -1) {
    // Replace the existing filter with the new one
    filters[existingFilterIndex] = {
      fieldName,
      operator,
      value
    };
  } else {
    // Push the new filter
    filters.push({
      fieldName,
      operator,
      value
    });
  }

  listRequest = { ...listRequest, filters, ignore: false };

  return listRequest;
};

export const camelCaseToLabel = (input: string): string => {
  // Replace capital letters with space followed by the lowercase letter
  const result = input.replace(/([A-Z])/g, ' $1');

  // Capitalize the first letter and trim any leading spaces
  return (
    result.charAt(0).toUpperCase() + result.slice(1).trim().replace('Lkey', '').replace(' Key', '')
  );
};

export const conjureValueBasedOnKeyFromList = (
  list: [],
  currentKey: string,
  preferredField: any
) => {
  let displayValue = currentKey;
  list.map(record => {

    if (record['key'] === currentKey) {
      displayValue = record[preferredField];
    }
  });
  return displayValue;
};

export const calculateAge = birthdate => {
  const birthDate = new Date(birthdate);
  const currentDate = new Date();

  const yearsDiff = currentDate.getFullYear() - birthDate.getFullYear();

  // Check if the current date hasn't reached the birthdate yet this year
  if (
    currentDate.getMonth() < birthDate.getMonth() ||
    (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate())
  ) {
    return yearsDiff - 1;
  } else {
    return yearsDiff;
  }
};
export const calculateAgeFormat=dateOfBirth=> {
  const today = new Date();
  const dob = new Date(dateOfBirth);

  if (isNaN(dob.getTime())) {
    return ''; 
  }

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  let days = today.getDate() - dob.getDate();
  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }
  if (days < 0) {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 0);
    days += lastMonth.getDate(); 
    months--;
  }
  const totalDays = (years * 365) + (months * 30) + days; 

  let ageString = '';

  if (years > 0) {
    ageString += `${years}y `;
  }

  if (months > 0) {
    ageString += `${months}m `;
  }

  if (days > 0) {
    ageString += `${days}d`;
  }

  return ageString.trim();  
}
export const convertStyleToObject = styleString => {
  const styleObject = {};
  styleString.split(';').forEach(item => {
    if (item) {
      const [key, value] = item.split(':');
      const camelCaseKey = key
        .split('-')
        .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join('');
      styleObject[camelCaseKey] = value;
    }
  });

  return styleObject;
};

export const formatDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 to month because months are 0-based
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
