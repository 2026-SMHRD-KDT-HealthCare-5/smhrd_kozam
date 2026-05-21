import "./InputField.css";

const InputField = ({
  label,
  icon,
  value,
  onChange,
  defaultValue,
  name,
  placeholder,
  helper,
  sideHelper,
  action,
  required,
  type = "text",
}) => {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <label className="field-block">
      <span>{label}</span>
      <div className="field-box">
        {icon}
        <input
          type={type}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
        />
        {action}
      </div>
      {(helper || sideHelper) && (
        <small>
          {helper}
          <b>{sideHelper}</b>
        </small>
      )}
    </label>
  );
};

export default InputField;
