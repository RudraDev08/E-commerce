// CategoryTree.jsx
export default function CategoryTree({ tree }) {
  return (
    <ul>
      {tree.map(c => (
        <li key={c._id}>
          {c.name}
          {c.children?.length > 0 && <CategoryTree tree={c.children} />}
        </li>
      ))}
    </ul>
  );
}
