const ActionButtonContent = ({ config }) => {
  const Icon = config.icon;

  return (
    <>
      <Icon />
      {config.label}
      <small>{config.description}</small>
    </>
  );
};
export default ActionButtonContent;
