import { Form, ActionPanel, Action } from "@raycast/api";

export default function Command() {
  const handleSubmit = async (values: { file: string[] }) => {
    console.log("Selected file:", values.file[0]);
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Share File" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="file"
        title="Select File"
        allowMultipleSelection={false}
      />
    </Form>
  );
}