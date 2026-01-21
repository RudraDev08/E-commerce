import { useState } from "react";

export default function AttributeInputs({ attributes, onGenerate }) {
  const [values, setValues] = useState({});

  const generate = () => {
    const keys = Object.keys(values);
    const combos = keys.reduce(
      (a, k) => a.flatMap(x => values[k].map(v => ({ ...x, [k]: v }))),
      [{}]
    );
    onGenerate(combos);
  };

  return (
    <div className="mt-4 space-y-3">
      {attributes.map(attr => (
        <input
          key={attr._id}
          placeholder={`Enter ${attr.name} values (comma separated)`}
          className="border p-2 w-full rounded"
          onBlur={e =>
            setValues({
              ...values,
              [attr.slug]: e.target.value.split(",")
            })
          }
        />
      ))}

      <button
        onClick={generate}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Generate Variants
      </button>
    </div>
  );
}
