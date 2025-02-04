import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, useModal } from '@ohif/ui';
import { ExtensionManager, ServicesManager, Types } from '@ohif/core';
import DataSourceConfigurationModalComponent from './DataSourceConfigurationModalComponent';

type DataSourceConfigurationComponentProps = {
  servicesManager: ServicesManager;
  extensionManager: ExtensionManager;
};

function DataSourceConfigurationComponent({
  servicesManager,
  extensionManager,
}: DataSourceConfigurationComponentProps): ReactElement {
  const { t } = useTranslation('DataSourceConfiguration');
  const { show, hide } = useModal();

  const { customizationService } = servicesManager.services;

  const [configurationAPI, setConfigurationAPI] = useState<
    Types.BaseDataSourceConfigurationAPI
  >();

  const [configuredItems, setConfiguredItems] = useState<
    Array<Types.BaseDataSourceConfigurationAPIItem>
  >();

  useEffect(() => {
    let shouldUpdate = true;

    const dataSourceChangedCallback = async () => {
      const activeDataSourceDef = extensionManager.getActiveDataSourceDefinition();

      if (!activeDataSourceDef.configuration.configurationAPI) {
        return;
      }

      const { factory: configurationAPIFactory } =
        customizationService.get(
          activeDataSourceDef.configuration.configurationAPI
        ) ?? {};

      if (!configurationAPIFactory) {
        return;
      }

      const configAPI = configurationAPIFactory(activeDataSourceDef.sourceName);
      setConfigurationAPI(configAPI);

      configAPI.getConfiguredItems().then(list => {
        if (shouldUpdate) {
          setConfiguredItems(list);
        }
      });
    };

    const sub = extensionManager.subscribe(
      extensionManager.EVENTS.ACTIVE_DATA_SOURCE_CHANGED,
      dataSourceChangedCallback
    );

    dataSourceChangedCallback();

    return () => {
      shouldUpdate = false;
      sub.unsubscribe();
    };
  }, []);

  return configuredItems ? (
    <div className="flex text-aqua-pale overflow-hidden items-center">
      <Icon
        name="settings"
        className="cursor-pointer shrink-0 w-3.5 h-3.5 mr-2.5"
        onClick={() =>
          show({
            content: DataSourceConfigurationModalComponent,
            title: t('Configure Data Source'),
            contentProps: {
              configurationAPI,
              configuredItems,
              onHide: hide,
            },
          })
        }
      ></Icon>
      {configuredItems.map((item, itemIndex) => {
        return (
          <div key={itemIndex} className="flex overflow-hidden">
            <div
              key={itemIndex}
              className="text-ellipsis whitespace-nowrap overflow-hidden"
            >
              {item.name}
            </div>
            {itemIndex !== configuredItems.length - 1 && (
              <div className="px-2.5">|</div>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <></>
  );
}

export default DataSourceConfigurationComponent;
