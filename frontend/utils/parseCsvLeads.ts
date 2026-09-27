export const parseCsvLeads = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        return resolve([]);
      }

      // Regex to extract all valid email patterns from raw CSV text
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = text.match(emailRegex) || [];

      // Remove duplicates
      const uniqueEmails = Array.from(new Set(matches.map((e) => e.toLowerCase())));
      resolve(uniqueEmails);
    };

    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};