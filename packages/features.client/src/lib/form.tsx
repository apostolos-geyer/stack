import { createFormHookContexts, createFormHook } from "@tanstack/react-form";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export type FieldContextType<T> = ReturnType<typeof useFieldContext<T>>;
export type FormContextType = ReturnType<typeof useFormContext>;

export type PropsWithForm<Props extends object = {}> = { form: FormContextType } & Props;
export type FormComponent<Props extends object = {}> = React.ComponentType<PropsWithForm<Props>>;

export const createFormComponent =
  <BaseProps extends object = {}>(Component: FormComponent<BaseProps>): React.FC<BaseProps> =>
    (props) => {
      const form: FormContextType = useFormContext()
      return <Component {...({ form, ...props })} />
    }

export type PropsWithField<FieldType, Props extends object = {}> = { field: FieldContextType<FieldType> } & Props;
export type FieldComponent<FieldType, Props extends object = {}> = React.ComponentType<PropsWithField<FieldType, Props>>;

export const createFieldComponent =
  <FieldType, BaseProps extends object = {}>(Component: FieldComponent<FieldType, BaseProps>): React.FC<BaseProps> =>
    (props) => {
      const field: FieldContextType<FieldType> = useFieldContext<FieldType>()
      return <Component {...({ field, ...props })} />
    }

export type AnyFieldComponents = Record<string, FieldComponent<any, any>>;

export const createFieldComponents = <CT extends AnyFieldComponents>(cs: CT): {
  [K in keyof CT]: React.FC<Omit<React.ComponentProps<CT[K]>, "field">>;
} => Object.fromEntries(
  Object.entries(cs).map(([key, comp]) => [key, createFieldComponent(comp)])
) as { [K in keyof CT]: React.FC<Omit<React.ComponentProps<CT[K]>, "field">> };

type AnyFormComponents = Record<string, FormComponent<any>>;

export type InitFormProps<
  TFieldComponents extends AnyFieldComponents,
  TFormComponents extends AnyFormComponents
> = {
  fieldComponents: TFieldComponents;
  formComponents: TFormComponents;
};

export const createFormComponents = <CT extends AnyFormComponents>(cs: CT): {
  [K in keyof CT]: React.FC<Omit<React.ComponentProps<CT[K]>, "form">>;
} => Object.fromEntries(
  Object.entries(cs).map(([key, comp]) => [key, createFormComponent(comp)])
) as { [K in keyof CT]: React.FC<Omit<React.ComponentProps<CT[K]>, "form">> };

export const createHooks = <
  TFieldComponents extends AnyFieldComponents,
  TFormComponents extends AnyFormComponents
>({ fieldComponents, formComponents }: InitFormProps<TFieldComponents, TFormComponents>) =>
  createFormHook({
    formContext,
    fieldContext,
    fieldComponents,
    formComponents
  })
