# babel-plugin-auto-localize-strings

```tsx
/* Before */
function Component() {
  return <Text>Hello, {user.name}</Text>;
}

/* After */
function Component() {
  return (
    <Text>
      <fbt>
        Hello,
        <fbt:param name="userName">{user.name}</fbt:param>
      </fbt>
    </Text>
  );
}
```

Links:

- https://astexplorer.net/
- https://github.com/jamiebuilds/babel-handbook/
- https://github.com/flipkart-incubator/babel-plugin-pseudolocalize-react-native
- https://facebook.github.io/fbt/
